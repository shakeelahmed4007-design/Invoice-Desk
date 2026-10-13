export function isPending(invoice) {
  return ['processing', 'needs_review'].includes(invoice.status);
}
export function isOverdue(invoice) {
  return isPending(invoice) && invoice.due_date < new Date().toLocaleDateString('en-CA');
}
export function exportInvoices(invoices) {
  // Prevent spreadsheet formula execution for untrusted text fields.
  const cell = (value) =>
    `"${String(value ?? '')
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  const rows = [
    [
      'Invoice',
      'Vendor',
      'Amount',
      'Currency',
      'Invoice date',
      'Due date',
      'Status',
      'Duplicate of',
      'Review reason',
      'Decision note',
    ],
    ...invoices.map((i) => [
      i.invoice_number,
      i.vendor_name,
      (i.amount / 100).toFixed(2),
      i.currency,
      i.invoice_date,
      i.due_date,
      i.status,
      i.duplicate_of_id,
      i.flag_reason,
      i.decision_note,
    ]),
  ];
  const csv = '\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
