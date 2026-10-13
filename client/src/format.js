export const money = (invoice) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.currency }).format(
    invoice.amount / 100,
  );
export const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    : '—';
export const timestamp = (value) =>
  value
    ? new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }).format(new Date(value)) + ' UTC'
    : '—';
