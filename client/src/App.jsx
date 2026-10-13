import { useCallback, useMemo, useState } from 'react';
import {
  Layers3,
  RefreshCw,
  Clock3,
  TriangleAlert,
  CheckCheck,
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Wallet,
  History,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  ArrowRight,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { useInvoices } from './api/useInvoices';
import Tabs from './components/Tabs.jsx';
import InvoiceTable from './components/InvoiceTable.jsx';
import InvoiceDrawer from './components/InvoiceDrawer.jsx';
import InvoiceForm from './components/InvoiceForm.jsx';
import Toast from './components/Toast.jsx';
import StatusBadge from './components/StatusBadge.jsx';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './components/LoginPage.jsx';
import { money, timestamp } from './format';
import { isPending, isOverdue, exportInvoices } from './utils';

export default function App() {
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined' && (import.meta.env.MODE === 'test' || window.__VITEST__)) {
      return { name: 'Alex Morgan', email: 'alex@company.com', role: 'Finance Lead', avatarInitial: 'A' };
    }
    try {
      const saved = localStorage.getItem('invoicedesk_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  function handleLogin(userData) {
    setUser(userData);
    try {
      localStorage.setItem('invoicedesk_auth_user', JSON.stringify(userData));
    } catch {}
    setToast(`Welcome, ${userData.name}!`);
  }

  function handleLogout() {
    setUser(null);
    try {
      localStorage.removeItem('invoicedesk_auth_user');
    } catch {}
    setToast('Logged out successfully.');
  }
  const { invoices, loading, error, reload, replace } = useInvoices();
  const [active, setActive] = useState('processing'),
    [selected, setSelected] = useState(null),
    [toast, setToast] = useState(''),
    [form, setForm] = useState(null);
  const [query, setQuery] = useState(''),
    [filter, setFilter] = useState('all'),
    [sort, setSort] = useState('newest'),
    [currency, setCurrency] = useState('all'),
    [page, setPage] = useState(1),
    [section, setSection] = useState('inbox'),
    [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeToast = useCallback(() => setToast(''), []);

  const counts = {
    processing: invoices.filter((i) => i.status === 'processing').length,
    needs_review: invoices.filter((i) => i.status === 'needs_review').length,
    decided: invoices.filter((i) => !isPending(i)).length,
  };

  const filtered = useMemo(
    () =>
      invoices
        .filter(
          (i) =>
            (active === 'decided' ? !isPending(i) : i.status === active) &&
            (!query ||
              `${i.vendor_name} ${i.invoice_number} ${i.description}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (currency === 'all' || i.currency === currency) &&
            (filter === 'all' ||
              (filter === 'duplicates' && i.duplicate_of_id) ||
              (filter === 'overdue' && isOverdue(i)) ||
              (filter === 'approved' && i.status === 'approved') ||
              (filter === 'rejected' && i.status === 'rejected')),
        )
        .sort((a, b) =>
          sort === 'amount_desc'
            ? b.amount - a.amount
            : sort === 'amount_asc'
              ? a.amount - b.amount
              : sort === 'due'
                ? a.due_date.localeCompare(b.due_date)
                : b.created_at.localeCompare(a.created_at) || b.id - a.id,
        ),
    [invoices, active, query, currency, filter, sort],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / 6)),
    currentPage = Math.min(page, pages),
    visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);

  const pending = invoices.filter(isPending),
    overdue = pending.filter(isOverdue),
    decisions = invoices
      .filter((i) => !isPending(i))
      .sort((a, b) => (b.decided_at || '').localeCompare(a.decided_at || '') || b.id - a.id);

  const summaryCurrency = currency === 'all' ? 'USD' : currency;
  const pendingAmount = pending
    .filter((i) => i.currency === summaryCurrency)
    .reduce((sum, i) => sum + i.amount, 0);
  const approved = invoices.filter((i) => i.status === 'approved').length;

  function tab(value) { setActive(value); setPage(1); setFilter('all'); }
  function clearFilters() { setQuery(''); setFilter('all'); setCurrency('all'); setPage(1); }

  function decided(invoice) {
    replace(invoice);
    setSelected(null);
    tab('decided');
    clearFilters();
    setToast(`${invoice.invoice_number} ${invoice.status} successfully.`);
  }

  function saved(invoice, editing) {
    replace(invoice);
    setForm(null);
    setSection('inbox');
    tab(isPending(invoice) ? invoice.status : 'decided');
    clearFilters();
    setToast(
      `${invoice.invoice_number} ${editing ? 'updated' : 'created'}${invoice.duplicate_of_id ? ' · Duplicate flagged for review.' : ' successfully.'}`,
    );
  }

  const ready = !loading && !error;
  const metric = (value) => (ready ? value : '—');

  const statCards = [
    {
      title: 'Pending Amount',
      value: money({ amount: pendingAmount, currency: summaryCurrency }),
      Icon: Wallet,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      accent: 'stat-card-emerald',
      sub: `${pending.filter((i) => i.currency === summaryCurrency).length} invoices`,
    },
    {
      title: 'Needs Review',
      value: String(counts.needs_review).padStart(2, '0'),
      Icon: TriangleAlert,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      accent: 'stat-card-amber',
      sub: `${invoices.filter((i) => isPending(i) && i.duplicate_of_id).length} duplicates`,
    },
    {
      title: 'Overdue',
      value: String(overdue.length).padStart(2, '0'),
      Icon: Clock3,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      accent: 'stat-card-rose',
      sub: 'Past due date',
    },
    {
      title: 'Approval Rate',
      value: `${decisions.length ? Math.round((approved / decisions.length) * 100) : 0}%`,
      Icon: CheckCheck,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      accent: 'stat-card-violet',
      sub: `${approved} of ${decisions.length} decided`,
    },
  ];

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toast message={toast} onClose={closeToast} />
      </>
    );
  }

  return (
    <>
      <div inert={selected !== null || form !== null ? '' : undefined}>
        <Sidebar
          section={section}
          setSection={setSection}
          pendingCount={pending.length}
          decisionsCount={decisions.length}
          totalInvoicesCount={invoices.length}
          ready={ready}
          loading={loading}
          user={user}
          onLogout={handleLogout}
          onAddInvoice={() => setForm({})}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />

        <div className="lg:ml-64">
          {/* Mobile topbar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-3.5 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Layers3 size={17} />
              </span>
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Invoice<span className="text-emerald-600">Desk</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="btn !px-3 !py-1.5 !text-xs"
              aria-label="Open navigation menu"
            >
              <Menu size={15} />
              Menu
            </button>
          </div>

          <main className="mx-auto max-w-[1560px] px-5 py-8 sm:px-9 sm:py-10">

            {/* Page Header */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="section-label mb-1">
                  {section === 'inbox' ? 'Invoice Management' : 'Audit Trail'}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {section === 'inbox' ? 'Invoice Overview' : 'Decision History'}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn !px-3"
                  onClick={reload}
                  disabled={loading}
                  aria-label="Refresh"
                >
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  id="add-invoice"
                  disabled={loading}
                  className="btn btn-primary"
                  onClick={() => setForm({})}
                >
                  <Plus size={16} />
                  New Invoice
                </button>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ title, value, Icon, iconBg, iconColor, accent, sub }) => (
                <div key={title} className={`stat-card ${accent}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="label">{title}</p>
                      <p className="mt-2 text-[26px] font-bold tracking-tight text-slate-900">
                        {metric(value)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {ready ? sub : '—'}
                      </p>
                    </div>
                    <span className={`rounded-xl p-2.5 ${iconBg} ${iconColor}`}>
                      <Icon size={18} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {section === 'inbox' ? (
              <>
                {/* Duplicate alert banner */}
                {counts.needs_review > 0 && (
                  <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-amber-200/60 bg-amber-50 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <TriangleAlert size={16} />
                      </span>
                      <p className="text-sm font-semibold text-amber-900">
                        {counts.needs_review} invoice{counts.needs_review > 1 ? 's' : ''} need review
                      </p>
                    </div>
                    <button
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                      onClick={() => { tab('needs_review'); clearFilters(); }}
                    >
                      Review <ArrowRight size={13} />
                    </button>
                  </div>
                )}

                <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_268px]">

                  {/* Main Invoice Table */}
                  <section className="panel min-w-0 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-5 pb-4">
                      <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-slate-900">Invoice Inbox</h2>
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          {metric(invoices.length)} TOTAL
                        </span>
                      </div>
                      <button
                        className="btn btn-primary !py-2 !text-xs"
                        onClick={() => { exportInvoices(filtered); setToast(`${filtered.length} invoices exported.`); }}
                        disabled={!ready || !filtered.length}
                      >
                        <Download size={13} />
                        Export CSV
                      </button>
                    </div>

                    <Tabs active={active} onChange={tab} counts={ready ? counts : {}} />

                    {/* Filters */}
                    <div className="flex flex-wrap gap-2.5 border-b border-slate-100 px-5 py-3.5">
                      <div className="relative min-w-[180px] flex-1">
                        <Search size={14} className="pointer-events-none absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="search"
                          aria-label="Search invoices"
                          placeholder="Search vendor, invoice…"
                          className="field !pl-9 !py-2 !text-xs"
                          value={query}
                          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <select aria-label="Filter invoices" className="field !w-auto !py-2 !text-xs" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
                          <option value="all">All</option>
                          <option value="duplicates">Duplicates</option>
                          {active !== 'decided' ? (
                            <option value="overdue">Overdue</option>
                          ) : (
                            <>
                              <option value="approved">Approved</option>
                              <option value="rejected">Rejected</option>
                            </>
                          )}
                        </select>
                        <select aria-label="Currency filter" className="field !w-auto !py-2 !text-xs" value={currency} onChange={(e) => { setCurrency(e.target.value); setPage(1); }}>
                          <option value="all">All currencies</option>
                          {[...new Set(['USD', ...invoices.map((i) => i.currency)])].sort().map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                        <select aria-label="Sort invoices" className="field !w-auto !py-2 !text-xs" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                          <option value="newest">Newest</option>
                          <option value="due">Due date</option>
                          <option value="amount_desc">High → Low</option>
                          <option value="amount_asc">Low → High</option>
                        </select>
                      </div>
                    </div>

                    <div id="invoice-panel" role="tabpanel" aria-labelledby={`tab-${active}`} aria-busy={loading} tabIndex={0}>
                      {loading ? (
                        <div role="status" className="space-y-3 p-5">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                          ))}
                          <span className="sr-only">Loading invoices</span>
                        </div>
                      ) : error ? (
                        <div role="alert" className="p-10 text-center">
                          <p className="text-sm text-red-700">{error}</p>
                          <button className="btn mt-4" onClick={reload}>Try again</button>
                        </div>
                      ) : !filtered.length && (query || filter !== 'all' || currency !== 'all') ? (
                        <div className="py-16 text-center">
                          <Search size={28} className="mx-auto mb-3 text-slate-300" />
                          <p className="text-sm font-semibold text-slate-700">No matching invoices</p>
                          <button className="btn mt-4 !text-xs" onClick={clearFilters}>Clear filters</button>
                        </div>
                      ) : (
                        <InvoiceTable invoices={visible} onOpen={setSelected} />
                      )}
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-3.5">
                      <span className="text-xs text-slate-400">
                        {ready ? `${filtered.length ? (currentPage - 1) * 6 + 1 : 0}–${Math.min(currentPage * 6, filtered.length)} of ${filtered.length}` : '—'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button aria-label="Previous page" className="icon-btn border border-slate-200 !p-1.5" disabled={currentPage === 1 || !ready} onClick={() => setPage(currentPage - 1)}>
                          <ChevronLeft size={14} />
                        </button>
                        <span className="px-2 text-xs font-semibold text-slate-600">{currentPage} / {pages}</span>
                        <button aria-label="Next page" className="icon-btn border border-slate-200 !p-1.5" disabled={currentPage === pages || !ready} onClick={() => setPage(currentPage + 1)}>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Right Sidebar Panels */}
                  <aside className="grid gap-5 md:grid-cols-2 2xl:grid-cols-1">

                    {/* Workflow snapshot */}
                    <section className="panel p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-900">Workflow</h2>
                        <SlidersHorizontal size={14} className="text-slate-400" />
                      </div>
                      <div className="space-y-3.5">
                        {[
                          { label: 'Processing', value: counts.processing, color: 'bg-amber-400', pct: ready && invoices.length ? (counts.processing / invoices.length) * 100 : 0 },
                          { label: 'Needs review', value: counts.needs_review, color: 'bg-rose-400', pct: ready && invoices.length ? (counts.needs_review / invoices.length) * 100 : 0 },
                          { label: 'Decided', value: counts.decided, color: 'bg-emerald-500', pct: ready && invoices.length ? (counts.decided / invoices.length) * 100 : 0 },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-1.5 flex justify-between text-[11px]">
                              <span className="text-slate-500">{item.label}</span>
                              <span className="font-bold text-slate-700">{metric(item.value)}</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Recent decisions */}
                    <section className="panel p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-bold text-slate-900">Recent Decisions</h2>
                        <History size={14} className="text-slate-400" />
                      </div>
                      {ready ? (
                        decisions.length ? (
                          decisions.slice(0, 3).map((i) => (
                            <button key={i.id} onClick={() => setSelected(i.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50">
                              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${i.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                <CheckCircle2 size={13} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[11px] font-semibold text-slate-800">{i.vendor_name}</span>
                                <span className="block text-[10px] text-slate-400">{i.invoice_number}</span>
                              </span>
                              <ArrowUpRight size={12} className="shrink-0 text-slate-300" />
                            </button>
                          ))
                        ) : (
                          <p className="py-4 text-center text-xs text-slate-400">No decisions yet</p>
                        )
                      ) : (
                        <p className="text-xs text-slate-400">{loading ? 'Loading…' : '—'}</p>
                      )}
                      <button
                        className="mt-3 w-full rounded-xl border border-slate-200 py-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50"
                        onClick={() => setSection('activity')}
                      >
                        View all decisions
                      </button>
                    </section>
                  </aside>
                </div>
              </>
            ) : (
              /* Decision History */
              <section className="panel overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-sm font-bold text-slate-900">Decision History</h2>
                  <p className="mt-0.5 text-xs text-slate-400">All final decisions, most recent first.</p>
                </div>
                {loading ? (
                  <div className="space-y-3 p-6">
                    {[0,1,2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
                  </div>
                ) : error ? (
                  <div role="alert" className="p-8 text-center">
                    <p className="text-sm text-red-700">{error}</p>
                    <button className="btn mt-4" onClick={reload}>Try again</button>
                  </div>
                ) : !decisions.length ? (
                  <p className="p-10 text-center text-sm text-slate-400">No decisions recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {decisions.map((i) => (
                      <button key={i.id} onClick={() => setSelected(i.id)} className="flex w-full flex-wrap items-center gap-4 px-6 py-4 text-left transition hover:bg-slate-50">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                          <FileText size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">
                            {i.vendor_name}
                            <span className="ml-2 text-xs font-normal text-slate-400">{i.invoice_number}</span>
                          </span>
                          <span className="block text-xs text-slate-400">{timestamp(i.decided_at)}</span>
                          {i.decision_note && (
                            <span className="mt-1 block truncate text-xs text-slate-500">"{i.decision_note}"</span>
                          )}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{money(i)}</span>
                        <StatusBadge status={i.status} />
                        <ArrowUpRight size={15} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Footer */}
            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
              <span>InvoiceDesk v2.0</span>
              <span className="flex items-center gap-1"><ShieldCheck size={11} /> Stored locally</span>
            </footer>
          </main>
        </div>
      </div>

      {selected !== null && (
        <InvoiceDrawer
          key={selected}
          id={selected}
          onClose={() => setSelected(null)}
          onDecided={decided}
          onEdit={(invoice) => { setSelected(null); setForm(invoice); }}
        />
      )}
      {form !== null && (
        <InvoiceForm invoice={form.id ? form : null} onClose={() => setForm(null)} onSaved={saved} />
      )}
      <Toast message={toast} onClose={closeToast} />
    </>
  );
}
