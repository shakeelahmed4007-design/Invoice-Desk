import {
  Layers3,
  LayoutDashboard,
  History,
  Database,
  X,
  LogOut,
} from 'lucide-react';

export default function Sidebar({
  section,
  setSection,
  pendingCount,
  decisionsCount,
  totalInvoicesCount,
  ready,
  loading,
  user,
  onLogout,
  mobileOpen,
  onCloseMobile,
}) {
  const metric = (value) => (ready ? value : '—');

  const content = (
    <div className="flex h-full flex-col bg-[#090e17] text-slate-300 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.06]">
        <a href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/25 ring-1 ring-white/20 transition-all duration-200 group-hover:scale-105 group-hover:shadow-emerald-500/40">
            <Layers3 size={20} className="text-white" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-white">
                Invoice<span className="text-emerald-400">Desk</span>
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold tracking-wide text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">Accounts Payable</p>
          </div>
        </a>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Workspace Card */}
      <div className="p-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 transition-all hover:bg-white/[0.05] hover:border-white/[0.12]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30 shadow-inner">
              AP
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">Finance Workspace</p>
              <p className="truncate text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_6px_#34d399]" />
                Local · Accounts Payable
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Navigation
        </p>
        <nav aria-label="Workspace navigation" className="space-y-1">
          {[
            { id: 'inbox', label: 'Invoice overview', Icon: LayoutDashboard, count: pendingCount },
            { id: 'activity', label: 'Decision history', Icon: History, count: decisionsCount },
          ].map(({ id, label, Icon, count }) => {
            const isActive = section === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSection(id);
                  if (onCloseMobile) onCloseMobile();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-white font-semibold border border-emerald-500/30 shadow-sm shadow-emerald-950/50'
                    : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
                <Icon
                  size={18}
                  className={
                    isActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover:text-slate-200 transition-colors'
                  }
                />
                <span className="truncate">{label}</span>
                <span
                  className={`ml-auto rounded-lg px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/[0.06] text-slate-400 group-hover:bg-white/[0.1] group-hover:text-slate-200'
                  }`}
                >
                  {metric(count)}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System & Storage Status Footer */}
      <div className="mt-auto border-t border-white/[0.06] p-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner">
                <Database size={15} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">SQLite Storage</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                </div>
                <p className="text-[10px] text-slate-400">
                  {ready ? `${totalInvoicesCount} invoices · Local` : 'Syncing…'}
                </p>
              </div>
            </div>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-mono font-medium text-slate-400 border border-white/[0.08]">
              v2.0
            </span>
          </div>
        </div>

        {/* User Account & Logout */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5 transition-colors hover:bg-white/[0.05]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
              {user?.avatarInitial || user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">{user?.name || 'Alex Morgan'}</p>
              <p className="truncate text-[10px] text-slate-400">{user?.email || 'alex@company.com'}</p>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Log Out"
              aria-label="Log out"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-800/60 lg:flex z-30 shadow-xl shadow-black/20">
        {content}
      </aside>

      {/* Mobile Drawer (with Backdrop) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
