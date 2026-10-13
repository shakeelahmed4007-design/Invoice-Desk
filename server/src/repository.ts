import type Database from 'better-sqlite3';
import type { Filter, Invoice, InvoiceDetail, NewInvoice } from './types.js';
import { HttpError } from './errors.js';
/** Returns the earliest matching invoice; normalization ignores casing and outer whitespace. */
export function findDuplicate(
  db: Database.Database,
  invoice: Pick<NewInvoice, 'vendor_name' | 'invoice_number' | 'amount'>,
  excludeId = 0,
): Invoice | undefined {
  return db
    .prepare(
      `SELECT * FROM invoices WHERE lower(trim(vendor_name)) = lower(trim(?))
    AND lower(trim(invoice_number)) = lower(trim(?)) AND amount = ? AND id <> ? AND duplicate_of_id IS NULL ORDER BY created_at, id LIMIT 1`,
    )
    .get(invoice.vendor_name, invoice.invoice_number, invoice.amount, excludeId) as
    Invoice | undefined;
}
export class InvoiceRepository {
  constructor(private db: Database.Database) {}
  list(status?: Filter): Invoice[] {
    const where =
      status === 'decided'
        ? "WHERE status IN ('approved','rejected')"
        : status
          ? 'WHERE status = ?'
          : '';
    const stmt = this.db.prepare(
      `SELECT * FROM invoices ${where} ORDER BY created_at DESC, id DESC`,
    );
    return (status && status !== 'decided' ? stmt.all(status) : stmt.all()) as Invoice[];
  }
  get(id: number): InvoiceDetail {
    const invoice = this.db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as
      Invoice | undefined;
    if (!invoice) throw new HttpError(404, 'Invoice not found.');
    const original = invoice.duplicate_of_id
      ? (this.db
          .prepare('SELECT * FROM invoices WHERE id = ?')
          .get(invoice.duplicate_of_id) as Invoice)
      : null;
    return { ...invoice, original_invoice: original };
  }
  create(input: NewInvoice): InvoiceDetail {
    return this.db
      .transaction(() => {
        const duplicate = findDuplicate(this.db, input);
        const status = duplicate ? 'needs_review' : input.status;
        const now = new Date().toISOString();
        const result = this.db
          .prepare(
            `INSERT INTO invoices
        (invoice_number,vendor_name,amount,currency,invoice_date,due_date,description,status,duplicate_of_id,flag_reason,created_at,updated_at,decided_at)
        VALUES (@invoice_number,@vendor_name,@amount,@currency,@invoice_date,@due_date,@description,@status,@duplicate_of_id,@flag_reason,@now,@now,@decided_at)`,
          )
          .run({
            ...input,
            status,
            duplicate_of_id: duplicate?.id ?? null,
            flag_reason: duplicate
              ? `Possible duplicate of ${duplicate.invoice_number}`
              : (input.flag_reason ?? null),
            now,
            decided_at: ['approved', 'rejected'].includes(status) ? now : null,
          });
        return this.get(Number(result.lastInsertRowid));
      })
      .immediate();
  }
  update(id: number, input: NewInvoice): InvoiceDetail {
    return this.db
      .transaction(() => {
        const current = this.get(id);
        if (['approved', 'rejected'].includes(current.status))
          throw new HttpError(409, 'Decided invoices cannot be edited.');
        const keyChanged =
          current.vendor_name.trim().toLowerCase() !== input.vendor_name.trim().toLowerCase() ||
          current.invoice_number.trim().toLowerCase() !==
            input.invoice_number.trim().toLowerCase() ||
          current.amount !== input.amount ||
          current.currency !== input.currency;
        if (
          keyChanged &&
          this.db.prepare('SELECT 1 FROM invoices WHERE duplicate_of_id = ?').get(id)
        ) {
          throw new HttpError(
            409,
            'This invoice is the original for a duplicate. Its vendor, number, amount and currency cannot be changed; other fields can still be edited.',
          );
        }
        const duplicate = findDuplicate(this.db, input, id);
        this.db
          .prepare(
            `UPDATE invoices SET invoice_number=@invoice_number, vendor_name=@vendor_name,
        amount=@amount, currency=@currency, invoice_date=@invoice_date, due_date=@due_date,
        description=@description, status=@status, duplicate_of_id=@duplicate_of_id,
        flag_reason=@flag_reason, updated_at=@updated_at WHERE id=@id`,
          )
          .run({
            ...input,
            id,
            status: duplicate ? 'needs_review' : input.status,
            duplicate_of_id: duplicate?.id ?? null,
            flag_reason: duplicate
              ? `Possible duplicate of ${duplicate.invoice_number}`
              : input.flag_reason || null,
            updated_at: new Date().toISOString(),
          });
        return this.get(id);
      })
      .immediate();
  }
  decide(id: number, status: 'approved' | 'rejected', note?: string): InvoiceDetail {
    return this.db
      .transaction(() => {
        this.get(id);
        const now = new Date().toISOString();
        const result = this.db
          .prepare(
            `UPDATE invoices SET status = ?, decision_note = ?, decided_at = ?, updated_at = ?
        WHERE id = ? AND status IN ('processing','needs_review')`,
          )
          .run(status, note || null, now, now, id);
        if (!result.changes)
          throw new HttpError(
            409,
            'This invoice has already been decided. Only processing or needs_review invoices can be approved or rejected.',
          );
        return this.get(id);
      })
      .immediate();
  }
}
