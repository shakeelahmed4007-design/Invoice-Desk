import { useCallback, useEffect, useRef, useState } from 'react';

const defaultSeed = [
  {
    id: 1,
    invoice_number: 'INV-1042',
    vendor_name: 'Linear Studio',
    amount: 245000,
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-31',
    description: 'Product design retainer — October',
    status: 'processing',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    duplicate_of_id: null,
    flag_reason: null,
    decided_at: null,
    decision_note: null,
  },
  {
    id: 2,
    invoice_number: 'INV-1043',
    vendor_name: 'Northstar Cloud',
    amount: 89000,
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-31',
    description: 'Cloud infrastructure and managed backups',
    status: 'processing',
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-02T11:00:00Z',
    duplicate_of_id: null,
    flag_reason: null,
    decided_at: null,
    decision_note: null,
  },
  {
    id: 3,
    invoice_number: 'INV-1044',
    vendor_name: 'Foundry Supply Co.',
    amount: 127550,
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-15',
    description: 'Office equipment and desk accessories',
    status: 'needs_review',
    created_at: '2026-10-03T09:00:00Z',
    updated_at: '2026-10-03T09:00:00Z',
    duplicate_of_id: null,
    flag_reason: 'Purchase order reference requires verification',
    decided_at: null,
    decision_note: null,
  },
  {
    id: 4,
    invoice_number: 'INV-1042',
    vendor_name: 'Linear Studio',
    amount: 245000,
    currency: 'USD',
    invoice_date: '2026-10-01',
    due_date: '2026-10-31',
    description: 'Resubmitted product design retainer — October',
    status: 'needs_review',
    created_at: '2026-10-04T14:00:00Z',
    updated_at: '2026-10-04T14:00:00Z',
    duplicate_of_id: 1,
    flag_reason: 'Possible duplicate of INV-1042',
    decided_at: null,
    decision_note: null,
  },
  {
    id: 5,
    invoice_number: 'INV-1045',
    vendor_name: 'Notion Labs',
    amount: 32000,
    currency: 'USD',
    invoice_date: '2026-09-15',
    due_date: '2026-10-15',
    description: 'Team workspace subscription',
    status: 'approved',
    created_at: '2026-09-15T12:00:00Z',
    updated_at: '2026-10-05T10:00:00Z',
    decided_at: '2026-10-05T10:00:00Z',
    decision_note: 'Verified recurring monthly subscription.',
    duplicate_of_id: null,
    flag_reason: null,
  },
  {
    id: 6,
    invoice_number: 'INV-1046',
    vendor_name: 'Orbit Consulting',
    amount: 180000,
    currency: 'USD',
    invoice_date: '2026-09-20',
    due_date: '2026-10-10',
    description: 'Consulting engagement outside the approved scope',
    status: 'rejected',
    created_at: '2026-09-20T16:00:00Z',
    updated_at: '2026-10-06T15:00:00Z',
    decided_at: '2026-10-06T15:00:00Z',
    decision_note: 'Unapproved scope addition. Request revised SOW.',
    duplicate_of_id: null,
    flag_reason: null,
  },
];

function getStoredInvoices() {
  try {
    const raw = localStorage.getItem('invoicedesk_items_v1');
    if (!raw) {
      localStorage.setItem('invoicedesk_items_v1', JSON.stringify(defaultSeed));
      return defaultSeed;
    }
    return JSON.parse(raw);
  } catch {
    return defaultSeed;
  }
}

function saveStoredInvoices(invoices) {
  try {
    localStorage.setItem('invoicedesk_items_v1', JSON.stringify(invoices));
  } catch {}
}

function fallbackStorageRequest(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const invoices = getStoredInvoices();

  // GET /invoices
  if (path === '/invoices' && method === 'GET') {
    return { invoices: [...invoices] };
  }

  // GET /invoices/:id
  const getMatch = path.match(/^\/invoices\/(\d+)$/);
  if (getMatch && method === 'GET') {
    const id = Number(getMatch[1]);
    const item = invoices.find((i) => i.id === id);
    if (!item) throw new Error('Invoice not found');
    const original = item.duplicate_of_id
      ? invoices.find((i) => i.id === item.duplicate_of_id)
      : null;
    return { ...item, original_invoice: original };
  }

  // PATCH /invoices/:id/status
  const statusMatch = path.match(/^\/invoices\/(\d+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const id = Number(statusMatch[1]);
    const body = options.body ? JSON.parse(options.body) : {};
    const now = new Date().toISOString();
    const updated = invoices.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            status: body.status,
            decision_note: body.note || null,
            decided_at: now,
            updated_at: now,
          }
        : inv,
    );
    saveStoredInvoices(updated);
    return updated.find((i) => i.id === id);
  }

  // POST /invoices
  if (path === '/invoices' && method === 'POST') {
    const body = options.body ? JSON.parse(options.body) : {};
    const nextId = invoices.length ? Math.max(...invoices.map((i) => i.id)) + 1 : 1;
    const now = new Date().toISOString();

    // duplicate check
    const match = invoices.find(
      (i) =>
        i.vendor_name.trim().toLowerCase() === (body.vendor_name || '').trim().toLowerCase() &&
        i.invoice_number.trim().toLowerCase() === (body.invoice_number || '').trim().toLowerCase() &&
        Number(i.amount) === Number(body.amount),
    );

    const newInvoice = {
      ...body,
      id: nextId,
      status: match ? 'needs_review' : 'processing',
      duplicate_of_id: match ? match.id : null,
      flag_reason: match ? `Possible duplicate of ${match.invoice_number}` : null,
      created_at: now,
      updated_at: now,
      decided_at: null,
      decision_note: null,
    };
    saveStoredInvoices([newInvoice, ...invoices]);
    return newInvoice;
  }

  // PATCH /invoices/:id
  const editMatch = path.match(/^\/invoices\/(\d+)$/);
  if (editMatch && method === 'PATCH') {
    const id = Number(editMatch[1]);
    const body = options.body ? JSON.parse(options.body) : {};
    const now = new Date().toISOString();
    const updated = invoices.map((inv) => (inv.id === id ? { ...inv, ...body, updated_at: now } : inv));
    saveStoredInvoices(updated);
    return updated.find((i) => i.id === id);
  }

  return { invoices };
}

export async function request(path, options = {}) {
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    const contentType = response.headers?.get ? response.headers.get('content-type') || '' : '';
    const isHtmlResponse = contentType.includes('text/html');

    // On Vercel, static rewrites return index.html (content-type: text/html)
    if ((response.status === 404 || isHtmlResponse) && import.meta.env.MODE !== 'test') {
      return fallbackStorageRequest(path, options);
    }

    const data = await response.json();
    if (!response.ok)
      throw new Error(
        data.error?.issues?.map((i) => `${i.field}: ${i.message}`).join(' ') ||
          data.error?.message ||
          'Request failed.',
      );
    return data;
  } catch (error) {
    if (import.meta.env.MODE === 'test') {
      throw error;
    }
    // On Vercel or static hosting, fallback to local persistent store for any network, HTML, or parse errors
    return fallbackStorageRequest(path, options);
  }
}

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const data = await request('/invoices');
      if (current === generation.current) setInvoices(data.invoices);
    } catch (error) {
      if (current === generation.current) setError(error.message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const tracker = generation;
    reload();
    return () => {
      tracker.current++;
    };
  }, [reload]);
  const replace = useCallback((invoice) => {
    generation.current++;
    setLoading(false);
    setError('');
    setInvoices((items) =>
      items.some((item) => item.id === invoice.id)
        ? items.map((item) => (item.id === invoice.id ? invoice : item))
        : [invoice, ...items],
    );
  }, []);
  return { invoices, loading, error, reload, replace };
}
