import type Database from 'better-sqlite3';
import { InvoiceRepository } from './repository.js';
import type { NewInvoice } from './types.js';
export function seedDatabase(db: Database.Database) {
  db.transaction(() => {
    if (db.prepare("SELECT 1 FROM app_metadata WHERE key = 'seed_v1'").get()) return;
    const repo = new InvoiceRepository(db);
    const base = { currency: 'USD', invoice_date: '2026-10-01', due_date: '2026-10-31' };
    const invoices: NewInvoice[] = [
      {
        ...base,
        invoice_number: 'INV-1042',
        vendor_name: 'Linear Studio',
        amount: 245000,
        description: 'Product design retainer — October',
        status: 'processing',
      },
      {
        ...base,
        invoice_number: 'INV-1043',
        vendor_name: 'Northstar Cloud',
        amount: 89000,
        description: 'Cloud infrastructure and managed backups',
        status: 'processing',
      },
      {
        ...base,
        invoice_number: 'INV-1044',
        vendor_name: 'Foundry Supply Co.',
        amount: 127550,
        description: 'Office equipment and desk accessories',
        status: 'needs_review',
        flag_reason: 'Purchase order reference requires verification',
      },
      {
        ...base,
        invoice_number: 'INV-1042',
        vendor_name: 'Linear Studio',
        amount: 245000,
        description: 'Resubmitted product design retainer — October',
        status: 'needs_review',
      },
      {
        ...base,
        invoice_number: 'INV-1045',
        vendor_name: 'Notion Labs',
        amount: 32000,
        description: 'Team workspace subscription',
        status: 'approved',
      },
      {
        ...base,
        invoice_number: 'INV-1046',
        vendor_name: 'Orbit Consulting',
        amount: 180000,
        description: 'Consulting engagement outside the approved scope',
        status: 'rejected',
      },
    ];
    for (const invoice of invoices) repo.create(invoice);
    db.prepare("INSERT INTO app_metadata(key,value) VALUES ('seed_v1', ?)").run(
      new Date().toISOString(),
    );
  }).immediate();
}
