import { useEffect, useRef, useState } from 'react';
import { X, TriangleAlert, ArrowUpRight, Check, FileText } from 'lucide-react';
import { request } from '../api/useInvoices';
import { money, date, timestamp } from '../format';
import StatusBadge from './StatusBadge.jsx';
export default function InvoiceDrawer({ id, onClose, onDecided, onEdit }) {
  const [invoice, setInvoice] = useState(null),
    [error, setError] = useState(''),
    [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [note, setNote] = useState(''),
    [confirm, setConfirm] = useState(false),
    [showOriginal, setShowOriginal] = useState(false),
    [retry, setRetry] = useState(0);
  const dialog = useRef(null),
    close = useRef(null),
    rejectConfirm = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    close.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (before?.isConnected) before.focus();
      else document.querySelector('[role="tab"][aria-selected="true"]')?.focus();
    };
  }, []);
  useEffect(() => {
    if (confirm) rejectConfirm.current?.focus();
    else if (!dialog.current?.contains(document.activeElement)) close.current?.focus();
  }, [confirm, loading, error]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    request(`/invoices/${id}`, { signal: controller.signal })
      .then(setInvoice)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, retry]);
  function trap(event) {
    if (event.key === 'Escape' && !busy) {
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      const items = [
        ...dialog.current.querySelectorAll(
          'button:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
        ),
      ];
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }
  async function decide(status) {
    setBusy(true);
    setActionError('');
    try {
      const result = await request(`/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note }),
      });
      onDecided(result);
    } catch (e) {
      setActionError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const decided = invoice && ['approved', 'rejected'].includes(invoice.status);
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/35 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onKeyDown={trap}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <p className="label">Invoice details</p>
            <h2 id="drawer-title" className="mt-1 text-xl font-semibold">
              {invoice?.invoice_number || 'Loading invoice'}
            </h2>
          </div>
          <button
            ref={close}
            onClick={onClose}
            disabled={busy}
            aria-label="Close invoice details"
            className="btn !p-2"
          >
            <X size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6" aria-busy={loading}>
          {loading ? (
            <p role="status" className="py-12 text-center text-slate-500">
              Loading invoice details…
            </p>
          ) : error ? (
            <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">
              {error}
              <button className="btn mt-4 block" onClick={() => setRetry((v) => v + 1)}>
                Try again
              </button>
            </div>
          ) : (
            invoice && (
              <>
                <div className="rounded-xl border border-slate-200 bg-[#f8faf7] p-5">
                  <div className="flex items-center justify-between">
                    <FileText size={26} className="text-accent" />
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="mt-6 text-sm text-slate-500">{invoice.vendor_name}</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">{money(invoice)}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {invoice.currency} · {invoice.amount.toLocaleString()} cents
                  </p>
                </div>
                {invoice.flag_reason && (
                  <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
                    <div className="flex gap-2 font-semibold">
                      <TriangleAlert size={18} />
                      {invoice.duplicate_of_id ? 'Potential duplicate' : 'Review required'}
                    </div>
                    <p className="mt-2">{invoice.flag_reason}</p>
                    {invoice.original_invoice && (
                      <>
                        <button
                          className="mt-3 flex items-center gap-1 rounded font-semibold underline"
                          aria-expanded={showOriginal}
                          onClick={() => setShowOriginal((v) => !v)}
                        >
                          Compare original invoice <ArrowUpRight size={14} />
                        </button>
                        {showOriginal && (
                          <dl className="mt-3 space-y-2 rounded-lg bg-white p-3">
                            <dt className="font-semibold">
                              {invoice.original_invoice.invoice_number} · Record #
                              {invoice.original_invoice.id}
                            </dt>
                            <dd>
                              {invoice.original_invoice.vendor_name} ·{' '}
                              {money(invoice.original_invoice)}
                            </dd>
                            <dd>Invoice date: {date(invoice.original_invoice.invoice_date)}</dd>
                            <dd>Due: {date(invoice.original_invoice.due_date)}</dd>
                            <dd>{invoice.original_invoice.description}</dd>
                            <dd>
                              <StatusBadge status={invoice.original_invoice.status} />
                            </dd>
                          </dl>
                        )}
                      </>
                    )}
                  </div>
                )}
                <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-5">
                  {[
                    ['Record ID', `#${invoice.id}`],
                    ['Invoice number', invoice.invoice_number],
                    ['Vendor', invoice.vendor_name],
                    ['Currency', invoice.currency],
                    ['Invoice date', date(invoice.invoice_date)],
                    ['Due date', date(invoice.due_date)],
                    ['Created', timestamp(invoice.created_at)],
                    ['Updated', timestamp(invoice.updated_at)],
                    [
                      'Duplicate of',
                      invoice.duplicate_of_id ? `Record #${invoice.duplicate_of_id}` : 'None',
                    ],
                    ['Decided at', timestamp(invoice.decided_at)],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <dt className="label">{key}</dt>
                      <dd className="mt-1.5 break-words text-sm">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6">
                  <h3 className="label">Description</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {invoice.description}
                  </p>
                </div>
                {decided ? (
                  <div className="mt-6 rounded-lg bg-slate-50 p-4">
                    <h3 className="label">Decision note</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm">
                      {invoice.decision_note || 'No note recorded.'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6">
                    <label htmlFor="decision-note" className="text-sm font-semibold">
                      Decision note <span className="font-normal text-slate-500">(optional)</span>
                    </label>
                    <textarea
                      id="decision-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={2000}
                      disabled={busy}
                      rows={3}
                      className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 text-sm"
                    />
                    <p className="text-right text-xs text-slate-500">{note.length}/2,000</p>
                  </div>
                )}
                {actionError && (
                  <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">
                    {actionError}
                  </p>
                )}
              </>
            )
          )}
        </div>
        {invoice && !loading && !error && (
          <footer className="border-t bg-white p-6">
            {decided ? (
              <p className="mb-3 text-sm text-slate-500">
                This decision is final. Further changes are disabled.
              </p>
            ) : confirm ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="font-semibold text-red-900">Reject this invoice?</h3>
                <p className="mt-1 text-sm text-red-800">This decision cannot be undone.</p>
                <div className="mt-3 flex gap-2">
                  <button
                    ref={rejectConfirm}
                    className="btn !border-red-700 !bg-red-700 !text-white"
                    disabled={busy}
                    onClick={() => decide('rejected')}
                  >
                    {busy ? 'Saving…' : 'Confirm rejection'}
                  </button>
                  <button className="btn" disabled={busy} onClick={() => setConfirm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {!decided && (
              <button
                className="btn mb-3 w-full"
                disabled={busy || confirm}
                onClick={() => onEdit(invoice)}
              >
                Edit invoice details
              </button>
            )}
            <div className="flex gap-3">
              <button
                className="btn flex-1 text-red-700"
                disabled={decided || busy || confirm}
                onClick={() => setConfirm(true)}
              >
                Reject
              </button>
              <button
                className="btn btn-primary flex-1"
                disabled={decided || busy || confirm}
                onClick={() => decide('approved')}
              >
                <Check size={17} />
                {busy && !confirm ? 'Saving…' : 'Approve invoice'}
              </button>
            </div>
          </footer>
        )}
      </section>
    </div>
  );
}
