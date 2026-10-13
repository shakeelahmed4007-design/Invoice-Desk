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
      next.amount = 'Enter a positive amount with up to 2 decimals (maximum 999,999,999.99).';
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
      <label className="field-label" htmlFor={`field-${name}`}>
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
        className="field"
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `error-${name}` : undefined}
      />
      {errors[name] && (
        <p className="field-error" id={`error-${name}`}>
          {errors[name]}
        </p>
      )}
    </div>
  );
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:p-6"
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
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
              <Plus size={22} />
            </span>
            <div>
              <h2 id="form-title" className="text-xl font-bold">
                {invoice ? 'Edit invoice' : 'Create an invoice'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {invoice
                  ? 'Update the details before a decision is recorded.'
                  : 'Add the details. We’ll check for duplicates automatically.'}
              </p>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={close}
            disabled={busy}
            aria-label="Close invoice form"
          >
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit} noValidate className="overflow-y-auto">
          <div className="grid md:grid-cols-[1fr_260px]">
            <div className="space-y-5 p-6 sm:p-8">
              <div className="section-label">01 / Invoice information</div>
              <div className="grid gap-4 sm:grid-cols-2">
                {field('invoice_number', 'Invoice number', 'text', { maxLength: 80 })}
                {field('vendor_name', 'Vendor name', 'text', {
                  maxLength: 160,
                })}
                {field('amount', 'Amount', 'text', { inputMode: 'decimal' })}
                <div>
                  <label className="field-label" htmlFor="field-currency">
                    Currency
                  </label>
                  <select
                    id="field-currency"
                    name="currency"
                    value={values.currency}
                    onChange={change}
                    className="field"
                    disabled={busy}
                  >
                    {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR', 'AED'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                </div>
                {field('invoice_date', 'Invoice date', 'date')}
                {field('due_date', 'Due date', 'date', { min: values.invoice_date })}
              </div>
              <div>
                <label className="field-label" htmlFor="field-description">
                  Description
                </label>
                <textarea
                  id="field-description"
                  name="description"
                  value={values.description}
                  onChange={change}
                  className="field min-h-24"
                  maxLength={2000}
                  disabled={busy}
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? 'error-description' : undefined}
                />
                {errors.description && (
                  <p id="error-description" className="field-error">
                    {errors.description}
                  </p>
                )}
              </div>
              <div className="section-label pt-2">02 / Review preferences</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="field-status">
                    Initial workflow
                  </label>
                  <select
                    id="field-status"
                    className="field"
                    name="status"
                    value={values.status}
                    onChange={change}
                    disabled={busy}
                  >
                    <option value="processing">Processing</option>
                    <option value="needs_review">Needs review</option>
                  </select>
                </div>
                {field('flag_reason', 'Review reason (optional)', 'text', { maxLength: 500 })}
              </div>
              {failure && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                  {failure}
                </p>
              )}
            </div>
            <aside className="hidden border-l border-slate-100 bg-slate-50/70 p-6 md:block">
              <p className="section-label">Live preview</p>
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <FileText className="text-indigo-500" size={26} />
                <p className="mt-6 break-words text-xs font-medium text-slate-400">
                  {values.invoice_number || 'Invoice number'}
                </p>
                <p className="mt-2 break-words text-lg font-semibold">
                  {values.vendor_name || 'Vendor name'}
                </p>
                <p className="mt-5 break-all text-2xl font-bold tracking-tight">
                  {money({
                    amount: Math.round((Number(values.amount) || 0) * 100),
                    currency: values.currency,
                  })}
                </p>
                <div className="mt-5 border-t pt-4 text-xs text-slate-500">
                  Due {values.due_date || '—'}
                </div>
              </div>
              <div className="mt-6 flex gap-2 text-xs leading-relaxed text-slate-500">
                <ShieldCheck className="shrink-0 text-indigo-600" size={18} />
                <p>
                  Matching vendor, invoice number and amount? We’ll flag it for review instead of
                  silently adding a duplicate.
                </p>
              </div>
            </aside>
          </div>
          <footer className="sticky bottom-0 flex justify-between gap-3 border-t bg-white px-6 py-4">
            <button type="button" className="btn" disabled={busy} onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="animate-spin" size={16} />
              ) : (
                <ArrowRight size={16} />
              )}{' '}
              {busy ? 'Saving invoice…' : invoice ? 'Save changes' : 'Create invoice'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
