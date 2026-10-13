import { useEffect, useRef, useState } from 'react';
import { X, Plus, ShieldCheck, ArrowRight, LoaderCircle } from 'lucide-react';
import { request } from '../api/useInvoices';

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
      if (!values[key].trim()) next[key] = 'Required';
    const validAmount = /^\d+(\.\d{1,2})?$/.test(values.amount);
    const [whole, fraction = ''] = values.amount.split('.');
    const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    if (!validAmount || cents <= 0 || cents > 99999999999)
      next.amount = 'Invalid amount';
    if (!values.invoice_date) next.invoice_date = 'Required';
    if (!values.due_date || values.due_date < values.invoice_date)
      next.due_date = 'Must be on/after invoice date';
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 sm:p-6 backdrop-blur-md transition-opacity"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      {/* Centered Popup Dialog (Half-Screen Width: max-w-xl) */}
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-title"
        onKeyDown={keydown}
        className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl bg-white shadow-2xl shadow-black/35 border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Popup Header */}
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 shadow-sm">
              <Plus size={18} />
            </span>
            <div>
              <h2 id="form-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {invoice ? 'Edit invoice' : 'Create an invoice'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {invoice ? 'Modify details before decision.' : 'Add invoice details. Duplicates are checked automatically.'}
              </p>
            </div>
          </div>
          <button
            className="icon-btn hover:bg-slate-200/80 rounded-xl !p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            onClick={close}
            disabled={busy}
            aria-label="Close invoice form"
          >
            <X size={18} />
          </button>
        </header>

        {/* Popup Form Body */}
        <form onSubmit={submit} noValidate className="p-5 sm:p-6 space-y-3.5">
          {/* Row 1: Invoice Number & Vendor Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-invoice_number">
                  Invoice number <span className="text-emerald-600">*</span>
                </label>
                {errors.invoice_number && (
                  <span className="text-[10px] font-semibold text-red-600">{errors.invoice_number}</span>
                )}
              </div>
              <input
                ref={first}
                id="field-invoice_number"
                name="invoice_number"
                type="text"
                maxLength={80}
                placeholder="e.g. INV-1042"
                value={values.invoice_number}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl"
                aria-invalid={!!errors.invoice_number}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-vendor_name">
                  Vendor name <span className="text-emerald-600">*</span>
                </label>
                {errors.vendor_name && (
                  <span className="text-[10px] font-semibold text-red-600">{errors.vendor_name}</span>
                )}
              </div>
              <input
                id="field-vendor_name"
                name="vendor_name"
                type="text"
                maxLength={160}
                placeholder="e.g. Acme Corp"
                value={values.vendor_name}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl"
                aria-invalid={!!errors.vendor_name}
              />
            </div>
          </div>

          {/* Row 2: Amount (with Currency) & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-amount">
                  Amount &amp; Currency <span className="text-emerald-600">*</span>
                </label>
                {errors.amount && (
                  <span className="text-[10px] font-semibold text-red-600">{errors.amount}</span>
                )}
              </div>
              <div className="grid grid-cols-[1fr_88px] gap-2">
                <input
                  id="field-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={values.amount}
                  onChange={change}
                  disabled={busy}
                  className="field !py-2 !text-xs sm:!text-sm rounded-xl font-medium"
                  aria-invalid={!!errors.amount}
                />
                <select
                  id="field-currency"
                  name="currency"
                  value={values.currency}
                  onChange={change}
                  className="field !py-2 !text-xs sm:!text-sm rounded-xl font-semibold text-center"
                  disabled={busy}
                >
                  {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR', 'AED'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 text-[11px] font-semibold text-slate-700" htmlFor="field-status">
                Initial Workflow Status
              </label>
              <select
                id="field-status"
                name="status"
                value={values.status}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl font-medium"
              >
                <option value="processing">Processing</option>
                <option value="needs_review">Needs review</option>
              </select>
            </div>
          </div>

          {/* Row 3: Invoice Date & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-invoice_date">
                  Invoice date
                </label>
                {errors.invoice_date && (
                  <span className="text-[10px] font-semibold text-red-600">{errors.invoice_date}</span>
                )}
              </div>
              <input
                id="field-invoice_date"
                name="invoice_date"
                type="date"
                value={values.invoice_date}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl"
                aria-invalid={!!errors.invoice_date}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-due_date">
                  Due date
                </label>
                {errors.due_date && (
                  <span className="text-[10px] font-semibold text-red-600">{errors.due_date}</span>
                )}
              </div>
              <input
                id="field-due_date"
                name="due_date"
                type="date"
                min={values.invoice_date}
                value={values.due_date}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl"
                aria-invalid={!!errors.due_date}
              />
            </div>
          </div>

          {/* Row 4: Description & Review Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-700" htmlFor="field-description">
                  Description <span className="text-emerald-600">*</span>
                </label>
                {errors.description && (
                  <span className="text-[10px] font-semibold text-red-600">{errors.description}</span>
                )}
              </div>
              <textarea
                id="field-description"
                name="description"
                rows={2}
                maxLength={2000}
                placeholder="Work or items delivered…"
                value={values.description}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl min-h-[58px] max-h-[64px] resize-none"
                aria-invalid={!!errors.description}
              />
            </div>

            <div>
              <label className="block mb-1 text-[11px] font-semibold text-slate-700" htmlFor="field-flag_reason">
                Review reason (optional)
              </label>
              <textarea
                id="field-flag_reason"
                name="flag_reason"
                rows={2}
                maxLength={500}
                placeholder="Optional notes if flagging for review…"
                value={values.flag_reason}
                onChange={change}
                disabled={busy}
                className="field !py-2 !text-xs sm:!text-sm rounded-xl min-h-[58px] max-h-[64px] resize-none"
              />
            </div>
          </div>

          {failure && (
            <p role="alert" className="rounded-xl bg-red-50 border border-red-200 p-2 text-xs text-red-700">
              {failure}
            </p>
          )}

          {/* Popup Footer Actions */}
          <footer className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>Auto-duplicate checks</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn !py-2 !px-4 !text-xs font-semibold"
                disabled={busy}
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary !py-2 !px-4 !text-xs font-bold"
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={14} />
                ) : (
                  <ArrowRight size={14} />
                )}
                <span>{busy ? 'Saving…' : invoice ? 'Save changes' : 'Create invoice'}</span>
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
