import { useEffect, useRef, useState } from 'react';
import { X, Plus, ShieldCheck, FileText, ArrowRight, LoaderCircle } from 'lucide-react';
import { request } from '../api/useInvoices';
import { money } from '../format';

const today = () => new Date().toLocaleDateString('en-CA');

export default function InvoiceForm({ invoice, onClose, onSaved }) {
  const initial = invoice
    ? {
        ...invoice,
        amount: (invoice.amount / 100).toFixed(2),
        flag_reason: invoice.duplicate_of_id ? '' : invoice.flag_reason || '',
      }
    : {
        invoice_number: '',
        vendor_name: '',
        amount: '',
        currency: 'USD',
        invoice_date: today(),
        due_date: today(),
        description: '',
        status: 'processing',
        flag_reason: '',
      };

  const [values, setValues] = useState(initial),
    [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState('');

  const panel = useRef(null),
    first = useRef(null);

  useEffect(() => {
    const before = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    first.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (before?.isConnected) before.focus();
      else document.getElementById('add-invoice')?.focus();
    };
  }, []);

  function change(event) {
    const { name, value } = event.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  }

  function close() {
    if (
      !busy &&
      (!Object.keys(values).some((k) => values[k] !== initial[k]) ||
        window.confirm('Discard your unsaved invoice changes?'))
    )
      onClose();
  }

  function keydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab') {
      const fields = [
        ...panel.current.querySelectorAll(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)',
        ),
      ];
      if (event.shiftKey && document.activeElement === fields[0]) {
        event.preventDefault();
        fields.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === fields.at(-1)) {
        event.preventDefault();
        fields[0]?.focus();
      }
    }
  }

  async function submit(event) {
    event.preventDefault();
    const next = {};
    for (const key of ['invoice_number', 'vendor_name', 'description'])
      if (!values[key].trim()) next[key] = 'This field is required.';
    const validAmount = /^\d+(\.\d{1,2})?$/.test(values.amount);
    const [whole, fraction = ''] = values.amount.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!validAmount || cents <= 0 || cents > 99999999999)
      next.amount = 'Enter a positive amount (e.g. 1200.50).';
    if (!values.invoice_date) next.invoice_date = 'Choose an invoice date.';
    if (!values.due_date || values.due_date < values.invoice_date)
      next.due_date = 'Due date must be on or after invoice date.';
    setErrors(next);
    if (Object.keys(next).length) {
      panel.current.querySelector(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    setFailure('');
    try {
      const body = {
        invoice_number: values.invoice_number,
        vendor_name: values.vendor_name,
        amount: cents,
        currency: values.currency,
        invoice_date: values.invoice_date,
        due_date: values.due_date,
        description: values.description,
        status: values.status,
        flag_reason: values.flag_reason,
      };
      const saved = await request(invoice ? `/invoices/${invoice.id}` : '/invoices', {
        method: invoice ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      onSaved(saved, !!invoice);
    } catch (e) {
      setFailure(e.message);
    } finally {
      setBusy(false);
    }
  }

  const field = (name, label, type = 'text', extra = {}) => (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700" htmlFor={`field-${name}`}>
        {label}
      </label>
      <input
        {...extra}
        ref={name === 'invoice_number' ? first : undefined}
        id={`field-${name}`}
        name={name}
        type={type}
        value={values[name]}
        onChange={change}
        disabled={busy}
        className="field !py-2 !text-xs sm:!text-sm rounded-xl"
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `error-${name}` : undefined}
      />
      {errors[name] && (
        <p className="mt-1 text-[11px] font-medium text-red-600" id={`error-${name}`}>
          {errors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        onKeyDown={keydown}
        className="flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200/80"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-sm">
              <Plus size={18} />
            </span>
            <div>
              <h2 id="form-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {invoice ? 'Edit invoice' : 'Create an invoice'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {invoice
                  ? 'Update invoice details before review.'
                  : 'Add invoice details. Duplicates are flagged automatically.'}
              </p>
            </div>
          </div>
          <button
            className="icon-btn hover:bg-slate-100 rounded-xl !p-1.5"
            onClick={close}
            disabled={busy}
            aria-label="Close invoice form"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Body (Fit onto 1 screen) */}
        <form onSubmit={submit} noValidate className="flex flex-col overflow-hidden">
          <div className="grid md:grid-cols-[1fr_250px] overflow-hidden">
            {/* Form Fields Left Column */}
            <div className="space-y-3 p-4 sm:p-5 lg:p-6 overflow-y-auto max-h-[calc(96vh-125px)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                  01 / Invoice Information
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {field('invoice_number', 'Invoice number', 'text', { maxLength: 80, placeholder: 'e.g. INV-1042' })}
                  {field('vendor_name', 'Vendor name', 'text', { maxLength: 160, placeholder: 'e.g. Acme Corp' })}
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-4">
                <div className="sm:col-span-2">
                  {field('amount', 'Amount', 'text', { inputMode: 'decimal', placeholder: '0.00' })}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700" htmlFor="field-currency">
                    Currency
                  </label>
                  <select
                    id="field-currency"
                    name="currency"
                    value={values.currency}
                    onChange={change}
                    className="field !py-2 !text-xs sm:!text-sm rounded-xl"
                    disabled={busy}
                  >
                    {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR', 'AED'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-700" htmlFor="field-status">
                    Status
                  </label>
                  <select
                    id="field-status"
                    className="field !py-2 !text-xs sm:!text-sm rounded-xl"
                    name="status"
                    value={values.status}
                    onChange={change}
                    disabled={busy}
                  >
                    <option value="processing">Processing</option>
                    <option value="needs_review">Needs review</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {field('invoice_date', 'Invoice date', 'date')}
                {field('due_date', 'Due date', 'date', { min: values.invoice_date })}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-700" htmlFor="field-description">
                  Description
                </label>
                <textarea
                  id="field-description"
                  name="description"
                  value={values.description}
                  onChange={change}
                  rows={2}
                  className="field !py-2 !text-xs sm:!text-sm rounded-xl min-h-[52px] max-h-[70px] resize-none"
                  maxLength={2000}
                  placeholder="Brief description of work or services delivered…"
                  disabled={busy}
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'error-description' : undefined}
                />
                {errors.description && (
                  <p id="error-description" className="mt-1 text-[11px] font-medium text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Review Reason (Optional) */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1.5">
                  02 / Review Notes
                </p>
                {field('flag_reason', 'Review reason (optional)', 'text', {
                  maxLength: 500,
                  placeholder: 'Optional note explaining review requirement…',
                })}
              </div>

              {failure && (
                <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  {failure}
                </p>
              )}
            </div>

            {/* Live Preview Sidebar */}
            <aside className="hidden border-l border-slate-100 bg-slate-50/60 p-4 sm:p-5 md:flex md:flex-col md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Live Preview
                </p>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <FileText size={17} />
                  </div>
                  <p className="mt-4 truncate text-[11px] font-mono text-slate-400">
                    {values.invoice_number || 'INV-0000'}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {values.vendor_name || 'Vendor Name'}
                  </p>
                  <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">
                    {money({
                      amount: Math.round((Number(values.amount) || 0) * 100),
                      currency: values.currency,
                    })}
                  </p>
                  <div className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-400 flex justify-between">
                    <span>Due Date</span>
                    <span className="font-semibold text-slate-600">{values.due_date || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50/70 border border-emerald-100 p-3 text-[11px] text-emerald-800 leading-snug">
                <ShieldCheck className="shrink-0 text-emerald-600 mt-0.5" size={14} />
                <p>Matching vendor, number, and amount will be auto-flagged as potential duplicate.</p>
              </div>
            </aside>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-100 bg-white px-5 py-3 sm:px-6 flex items-center justify-between">
            <button type="button" className="btn !py-2 !px-4 !text-xs font-semibold" disabled={busy} onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary !py-2 !px-5 !text-xs font-bold" disabled={busy}>
              {busy ? (
                <LoaderCircle className="animate-spin" size={14} />
              ) : (
                <ArrowRight size={14} />
              )}
              <span>{busy ? 'Saving…' : invoice ? 'Save changes' : 'Create invoice'}</span>
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
