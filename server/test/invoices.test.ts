import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../src/database.js';
import { seedDatabase } from '../src/seed.js';
import { createApp } from '../src/app.js';
import { findDuplicate, InvoiceRepository } from '../src/repository.js';
let db: ReturnType<typeof openDatabase>;
let app: ReturnType<typeof createApp>;
beforeEach(() => {
  db = openDatabase(':memory:');
  seedDatabase(db);
  app = createApp(db);
});
afterEach(() => db.close());
describe('invoice API', () => {
  it('lists all six invoices newest first and seeds only once', async () => {
    seedDatabase(db);
    const result = await request(app).get('/api/invoices').expect(200);
    expect(result.body.invoices).toHaveLength(6);
    const items = result.body.invoices;
    expect(items.map((i: { id: number; created_at: string }) => `${i.created_at}:${i.id}`)).toEqual(
      [...items]
        .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)
        .map((i) => `${i.created_at}:${i.id}`),
    );
  });
  it.each([
    ['processing', 2],
    ['needs_review', 2],
    ['approved', 1],
    ['rejected', 1],
    ['decided', 2],
  ])('filters %s', async (status, count) => {
    const result = await request(app).get(`/api/invoices?status=${status}`).expect(200);
    expect(result.body.invoices).toHaveLength(count);
    expect(
      result.body.invoices.every((i: { status: string }) =>
        status === 'decided' ? ['approved', 'rejected'].includes(i.status) : i.status === status,
      ),
    ).toBe(true);
  });
  it('returns full details and the original duplicate', async () => {
    const result = await request(app).get('/api/invoices/4').expect(200);
    expect(result.body.duplicate_of_id).toBe(1);
    expect(result.body.original_invoice.id).toBe(1);
    expect(result.body.flag_reason).toBe('Possible duplicate of INV-1042');
  });
  it.each(['approved', 'rejected'])('records %s, note and timestamp', async (status) => {
    const result = await request(app)
      .patch('/api/invoices/1/status')
      .send({ status, note: '  Checked PO  ' })
      .expect(200);
    expect(result.body).toMatchObject({ status, decision_note: 'Checked PO' });
    expect(result.body.decided_at).toBeTruthy();
    expect(result.body.updated_at).toBe(result.body.decided_at);
    expect((await request(app).get('/api/invoices/1')).body.status).toBe(status);
  });
  it.each(['0', '-1', 'abc', '9999', '1.1', '9007199254740992'])(
    'returns 404 for invalid or absent id %s',
    async (id) => {
      await request(app).get(`/api/invoices/${id}`).expect(404);
      await request(app)
        .patch(`/api/invoices/${id}/status`)
        .send({ status: 'approved' })
        .expect(404);
    },
  );
  it.each([
    { status: 'processing' },
    {},
    { status: 'approved', note: 42 },
    { status: 'approved', extra: true },
    { status: 'approved', note: 'x'.repeat(2001) },
  ])('returns formatted validation errors', async (body) => {
    const result = await request(app).patch('/api/invoices/1/status').send(body).expect(400);
    expect(result.body.error.message).toBe('Validation failed.');
    expect(result.body.error.issues.length).toBeGreaterThan(0);
  });
  it('rejects invalid filters and malformed JSON', async () => {
    await request(app).get('/api/invoices?status=other').expect(400);
    await request(app)
      .patch('/api/invoices/1/status')
      .set('Content-Type', 'application/json')
      .send('{')
      .expect(400);
  });
  it.each([5, 6])('returns 409 for decided record %s without overwriting it', async (id) => {
    const before = (await request(app).get(`/api/invoices/${id}`)).body;
    const result = await request(app)
      .patch(`/api/invoices/${id}/status`)
      .send({ status: 'approved', note: 'overwrite' })
      .expect(409);
    expect(result.body.error.message).toContain('already been decided');
    expect((await request(app).get(`/api/invoices/${id}`)).body).toEqual(before);
  });
  it('only allows one competing decision', async () => {
    const responses = await Promise.all(
      ['approved', 'rejected'].map((status) =>
        request(app).patch('/api/invoices/1/status').send({ status }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it('reports health and permits the configured dev origin', async () => {
    const result = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(result.body).toEqual({ status: 'ok' });
    expect(result.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
describe('repository', () => {
  it('detects duplicates on future inserts and assigns review status', () => {
    const repo = new InvoiceRepository(db);
    const input = {
      invoice_number: ' inv-1042 ',
      vendor_name: ' linear studio ',
      amount: 245000,
      currency: 'USD',
      invoice_date: '2026-10-01',
      due_date: '2026-10-31',
      description: 'New import',
      status: 'processing' as const,
    };
    expect(findDuplicate(db, input)?.id).toBe(1);
    const duplicate = repo.create(input);
    expect(duplicate).toMatchObject({
      status: 'needs_review',
      duplicate_of_id: 1,
      flag_reason: 'Possible duplicate of INV-1042',
    });
    expect(findDuplicate(db, { ...input, amount: 245001 })).toBeUndefined();
  });
  it('persists decisions after closing and reopening a file DB', () => {
    const directory = mkdtempSync(join(tmpdir(), 'invoice-test-'));
    const path = join(directory, 'desk.db');
    let fileDb = openDatabase(path);
    try {
      seedDatabase(fileDb);
      new InvoiceRepository(fileDb).decide(1, 'approved', 'Persist this');
      fileDb.close();
      fileDb = openDatabase(path);
      seedDatabase(fileDb);
      expect(new InvoiceRepository(fileDb).get(1)).toMatchObject({
        status: 'approved',
        decision_note: 'Persist this',
      });
      expect(new InvoiceRepository(fileDb).list()).toHaveLength(6);
    } finally {
      fileDb.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('invoice creation and editing', () => {
  const input = {
    invoice_number: 'INV-2001',
    vendor_name: 'Acme Studio',
    amount: 12345,
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-31',
    description: 'October design services',
    status: 'processing',
  };
  it('creates an invoice with exact cents and a Location header', async () => {
    const result = await request(app).post('/api/invoices').send(input).expect(201);
    expect(result.headers.location).toBe(`/api/invoices/${result.body.id}`);
    expect(result.body).toMatchObject({ ...input, decided_at: null, duplicate_of_id: null });
    expect((await request(app).get(`/api/invoices/${result.body.id}`)).body.amount).toBe(12345);
  });
  it('detects real duplicates through POST, even with case and whitespace differences', async () => {
    await request(app).post('/api/invoices').send(input).expect(201);
    const result = await request(app)
      .post('/api/invoices')
      .send({ ...input, vendor_name: ' ACME studio ' })
      .expect(201);
    expect(result.body.status).toBe('needs_review');
    expect(result.body.original_invoice.vendor_name).toBe('Acme Studio');
  });
  it.each([
    { amount: 1.5 },
    { amount: 0 },
    { amount: -1 },
    { amount: 100000000000 },
    { currency: 'XYZ' },
    { invoice_date: '2026-02-30' },
    { due_date: '2026-09-01' },
    { vendor_name: ' ' },
    { invoice_number: '' },
    { description: '' },
    { status: 'approved' },
    { extra: 'unexpected' },
  ])('validates new invoice fields: %j', async (change) => {
    const result = await request(app)
      .post('/api/invoices')
      .send({ ...input, ...change })
      .expect(400);
    expect(result.body.error.issues.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/invoices')).body.invoices).toHaveLength(6);
  });
  it('updates a pending invoice and recomputes duplicate flags', async () => {
    const created = (await request(app).post('/api/invoices').send(input)).body;
    const updated = await request(app)
      .patch(`/api/invoices/${created.id}`)
      .send({ ...input, invoice_number: 'INV-1042', vendor_name: 'Linear Studio', amount: 245000 })
      .expect(200);
    expect(updated.body).toMatchObject({ duplicate_of_id: 1, status: 'needs_review' });
    const unique = await request(app).patch(`/api/invoices/${created.id}`).send(input).expect(200);
    expect(unique.body).toMatchObject({
      duplicate_of_id: null,
      flag_reason: null,
      status: 'processing',
    });
  });
  it('rejects editing decided or nonexistent invoices', async () => {
    await request(app).patch('/api/invoices/5').send(input).expect(409);
    await request(app).patch('/api/invoices/999').send(input).expect(404);
    await request(app).patch('/api/invoices/nope').send(input).expect(404);
  });
  it('preserves the original duplicate identity but allows description corrections', async () => {
    const original = (await request(app).get('/api/invoices/1')).body;
    const originalInput = {
      ...input,
      invoice_number: original.invoice_number,
      vendor_name: original.vendor_name,
      amount: original.amount,
    };
    await request(app)
      .patch('/api/invoices/1')
      .send({ ...originalInput, amount: 100 })
      .expect(409);
    const result = await request(app)
      .patch('/api/invoices/1')
      .send({ ...originalInput, description: 'Corrected description' })
      .expect(200);
    expect(result.body.duplicate_of_id).toBeNull();
    expect((await request(app).get('/api/invoices/4')).body.original_invoice.description).toBe(
      'Corrected description',
    );
  });
});
