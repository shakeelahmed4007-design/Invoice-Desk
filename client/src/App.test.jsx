// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
let records;
const base = {
  currency: 'USD',
  invoice_date: '2026-10-01',
  due_date: '2026-10-31',
  created_at: '2026-10-13T12:00:00Z',
  updated_at: '2026-10-13T12:00:00Z',
  description: 'Design retainer',
  amount: 245000,
  decided_at: null,
  decision_note: null,
  duplicate_of_id: null,
  flag_reason: null,
};
beforeEach(() => {
  records = [
    {
      ...base,
      id: 1,
      invoice_number: 'INV-1042',
      vendor_name: 'Linear Studio',
      status: 'processing',
    },
    {
      ...base,
      id: 2,
      invoice_number: 'INV-1042',
      vendor_name: 'Linear Studio',
      status: 'needs_review',
      duplicate_of_id: 1,
      flag_reason: 'Possible duplicate of INV-1042',
    },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (path, options = {}) => {
      if (path === '/api/invoices')
        return { ok: true, json: async () => ({ invoices: records.map((i) => ({ ...i })) }) };
      const id = Number(path.split('/')[3]);
      const item = records.find((i) => i.id === id);
      if (options.method === 'PATCH') {
        const body = JSON.parse(options.body);
        Object.assign(item, {
          status: body.status,
          decision_note: body.note,
          decided_at: base.created_at,
        });
      }
      return {
        ok: true,
        json: async () => ({ ...item, original_invoice: item.duplicate_of_id ? records[0] : null }),
      };
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it('approves with a note, moves tabs, and preserves the decision when remounted', async () => {
  const user = userEvent.setup();
  const view = render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Open INV-1042 from Linear Studio' }));
  await user.type(await screen.findByLabelText('Decision note (optional)'), 'Verified');
  await user.click(screen.getByRole('button', { name: 'Approve invoice', exact: true }));
  await screen.findByText('INV-1042 approved successfully.');
  expect(
    screen.getByRole('tab', { name: 'Approved / Rejected 1' }).getAttribute('aria-selected'),
  ).toBe('true');
  expect(records[0].decision_note).toBe('Verified');
  view.unmount();
  render(<App />);
  await screen.findByText('All clear here');
  await user.click(screen.getByRole('tab', { name: 'Approved / Rejected 1' }));
  await user.click(screen.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }));
  await screen.findByText('Verified');
  expect(screen.getByRole('button', { name: 'Approve invoice', exact: true }).disabled).toBe(true);
});
it('compares duplicates and requires confirmation for rejection', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByRole('button', { name: 'Open INV-1042 from Linear Studio' });
  await user.click(screen.getByRole('tab', { name: 'Needs review 1' }));
  await user.click(screen.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }));
  await user.click(await screen.findByRole('button', { name: 'Compare original invoice' }));
  expect(screen.getByText('INV-1042 · Record #1')).toBeTruthy();
  await user.click(screen.getByRole('button', { name: 'Reject', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Cancel', exact: true }));
  expect(records[1].status).toBe('needs_review');
  await user.click(screen.getByRole('button', { name: 'Reject', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Confirm rejection' }));
  await screen.findByText('INV-1042 rejected successfully.');
  expect(records[1].status).toBe('rejected');
});
it('recovers from list and detail errors and supports keyboard tabs and Escape', async () => {
  const user = userEvent.setup();
  fetch.mockRejectedValueOnce(new Error('Connection failed'));
  render(<App />);
  await screen.findByText('Connection failed');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByRole('button', { name: 'Open INV-1042 from Linear Studio' });
  const tab = screen.getByRole('tab', { name: 'Processing 1' });
  tab.focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Needs review 1' }).getAttribute('aria-selected')).toBe(
    'true',
  );
  fetch.mockRejectedValueOnce(new Error('Detail unavailable'));
  await user.click(screen.getByRole('button', { name: 'Open INV-1042 from Linear Studio' }));
  const dialog = screen.getByRole('dialog');
  await within(dialog).findByText('Detail unavailable');
  await user.click(within(dialog).getByRole('button', { name: 'Try again' }));
  await within(dialog).findByRole('button', { name: 'Approve invoice', exact: true });
  await user.keyboard('{Escape}');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
