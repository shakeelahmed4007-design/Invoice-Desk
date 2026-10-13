import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const directory = await mkdtemp(join(tmpdir(), 'invoice-e2e-'));
const port = 3107;
let server, browser;
async function start() {
  server = spawn(process.execPath, ['server/dist/index.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port), DATABASE_PATH: join(directory, 'test.db') },
    stdio: 'pipe',
  });
  let logs = '';
  server.stderr.on('data', (chunk) => {
    logs += chunk;
  });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${logs}`);
    try {
      if ((await fetch(`http://localhost:${port}/api/health`)).ok) return;
    } catch {
      /* Poll until the child is listening. */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('API did not start');
}
async function stop() {
  if (server && server.exitCode === null)
    await new Promise((r) => {
      server.once('exit', r);
      server.kill('SIGTERM');
    });
}
try {
  await start();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${port}`);
  await page.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }).waitFor();
  if (process.env.DESK_SCREENSHOT)
    await page.screenshot({ path: process.env.DESK_SCREENSHOT, fullPage: true });
  await page.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }).click();
  await page.getByLabel('Decision note (optional)').fill('E2E approval persisted');
  await page.getByRole('button', { name: 'Approve invoice', exact: true }).click();
  await page.getByText('INV-1042 approved successfully.', { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('tab', { name: /Approved \/ Rejected/ }).click();
  await page.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }).click();
  await page.getByText('E2E approval persisted').waitFor();
  assert.equal(
    await page.getByRole('button', { name: 'Approve invoice', exact: true }).isDisabled(),
    true,
  );
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: /Needs review/ }).click();
  await page.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }).click();
  await page.getByRole('button', { name: 'Compare original invoice' }).click();
  await page.getByText('INV-1042 · Record #1').waitFor();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.equal(
    (await (await fetch(`http://localhost:${port}/api/invoices/4`)).json()).status,
    'needs_review',
  );
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm rejection' }).click();
  await page.getByText('INV-1042 rejected successfully.', { exact: true }).waitFor();
  await stop();
  await start();
  const stored = await (await fetch(`http://localhost:${port}/api/invoices/1`)).json();
  assert.equal(stored.status, 'approved');
  assert.equal(stored.decision_note, 'E2E approval persisted');
  assert.equal(
    (await (await fetch(`http://localhost:${port}/api/invoices`)).json()).invoices.length,
    6,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByRole('button', { name: 'Open INV-1043 from Northstar Cloud' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('button', { name: 'Open INV-1043 from Northstar Cloud' }).click();
  await page.getByRole('button', { name: 'Approve invoice', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Processing 1' }).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.getByRole('tab', { name: /Needs review/ }).getAttribute('aria-selected'),
    'true',
  );
  await page.route('**/api/invoices', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Test connection failure' } }),
    }),
  );
  await page.getByRole('button', { name: 'Refresh' }).click();
  await page.getByRole('alert').filter({ hasText: 'Test connection failure' }).waitFor();
  await page.unroute('**/api/invoices');
  await page.getByRole('button', { name: 'Try again' }).click();
  await page.getByRole('button', { name: 'Open INV-1044 from Foundry Supply Co.' }).waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Add invoice', exact: true }).click();
  await page.getByLabel('Invoice number', { exact: true }).fill('INV-NEW-01');
  await page.getByLabel('Vendor name', { exact: true }).fill('Test Design Company');
  await page.getByLabel('Amount', { exact: true }).fill('1234.56');
  await page.getByLabel('Invoice date', { exact: true }).fill('2026-10-01');
  await page.getByLabel('Due date', { exact: true }).fill('2026-10-31');
  await page.getByLabel('Description', { exact: true }).fill('Brand design project');
  await page.getByRole('button', { name: 'Create invoice', exact: true }).click();
  await page.getByText('INV-NEW-01 created successfully.', { exact: true }).waitFor();
  await page.getByLabel('Search invoices').fill('Test Design Company');
  await page.getByRole('button', { name: 'Open INV-NEW-01 from Test Design Company' }).click();
  await page.getByRole('button', { name: 'Edit invoice details' }).click();
  await page.getByLabel('Amount', { exact: true }).fill('1500.99');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await page.getByText('INV-NEW-01 updated successfully.', { exact: true }).waitFor();
  const newInvoice = (
    await (await fetch(`http://localhost:${port}/api/invoices`)).json()
  ).invoices.find((i) => i.invoice_number === 'INV-NEW-01');
  assert.equal(newInvoice.amount, 150099);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  assert.match((await download).suggestedFilename(), /^invoices-.*\.csv$/);
  await page.getByLabel('Search invoices').fill('no-such-vendor');
  await page.getByText('No matching invoices', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Add invoice', exact: true }).click();
  await page.getByLabel('Invoice number', { exact: true }).fill('INV-NEW-01');
  await page.getByLabel('Vendor name', { exact: true }).fill('Test Design Company');
  await page.getByLabel('Amount', { exact: true }).fill('1500.99');
  await page.getByLabel('Description', { exact: true }).fill('Duplicate import');
  await page.getByRole('button', { name: 'Create invoice', exact: true }).click();
  await page
    .getByText('INV-NEW-01 created · Possible duplicate sent to review.', { exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole('tab', { name: /Needs review/ }).getAttribute('aria-selected'),
    'true',
  );
  await page.getByLabel('Filter invoices').selectOption('duplicates');
  await page.getByRole('button', { name: 'Open INV-NEW-01 from Test Design Company' }).waitFor();
  await stop();
  await start();
  await page.reload();
  const persisted = await (
    await fetch(`http://localhost:${port}/api/invoices/${newInvoice.id}`)
  ).json();
  assert.equal(persisted.amount, 150099);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Add invoice', exact: true }).click();
  await page.getByRole('dialog').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole('button', { name: 'Close invoice form' }).click();
  assert.deepEqual(errors, []);
  console.log(
    'PASS: browser approval, rejection/cancel, duplicate preview, reload and process-restart persistence, mobile layout, keyboard tabs, error recovery, invoice creation/editing, search, CSV export, duplicate creation, mobile form, new-record persistence, no browser errors.',
  );
} finally {
  await browser?.close();
  await stop();
  await rm(directory, { recursive: true, force: true });
}
