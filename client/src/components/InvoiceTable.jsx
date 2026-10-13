import { ArrowUpRight, TriangleAlert, FileCheck2 } from 'lucide-react';
import { isOverdue } from '../utils';
import StatusBadge from './StatusBadge.jsx';
import { money, date } from '../format';

export default function InvoiceTable({ invoices, onOpen }) {
  if (!invoices.length)
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
          <FileCheck2 size={26} />
        </div>
        <h3 className="text-sm font-semibold text-slate-700">All clear here</h3>
        <p className="mt-1 text-xs text-slate-400">No invoices in this stage.</p>
      </div>
    );

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="sr-only">
          Invoices in the selected status. Select an invoice to view details.
        </caption>
        <thead>
          <tr className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {['Invoice / Vendor', 'Amount', 'Due Date', 'Status', ''].map((heading, index) => (
              <th key={index} scope="col" className="px-6 py-3">
                {heading || <span className="sr-only">Open</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice) => (
            <tr
              key={invoice.id}
              onClick={() => onOpen(invoice.id)}
              className="cursor-pointer transition-colors hover:bg-emerald-50/40"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-slate-100 text-xs font-bold text-slate-600 ring-1 ring-slate-200"
                    aria-hidden="true"
                  >
                    {invoice.vendor_name.split(' ').slice(0, 2).map((v) => v[0]).join('')}
                  </div>
                  <div>
                    <button
                      className="rounded text-left text-sm font-semibold text-slate-900 hover:text-emerald-700"
                      onClick={(e) => { e.stopPropagation(); onOpen(invoice.id); }}
                      aria-label={`Open ${invoice.invoice_number} from ${invoice.vendor_name}`}
                    >
                      {invoice.invoice_number}
                    </button>
                    <div className="mt-0.5 text-xs text-slate-400">{invoice.vendor_name}</div>
                  </div>
                  {invoice.duplicate_of_id && (
                    <span className="ml-1 inline-flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 ring-1 ring-orange-200/80">
                      <TriangleAlert size={10} />
                      Duplicate
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="font-bold tabular-nums text-slate-900">{money(invoice)}</span>
                <div className="mt-0.5 text-[10px] font-medium text-slate-400">{invoice.currency}</div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {date(invoice.due_date)}
                {isOverdue(invoice) && (
                  <span className="mt-0.5 block text-[10px] font-bold text-rose-500">Overdue</span>
                )}
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={invoice.status} />
              </td>
              <td className="px-6 py-4">
                <ArrowUpRight size={15} className="text-slate-300" aria-hidden="true" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
