export const tabs = [
  { id: 'processing', label: 'Processing' },
  { id: 'needs_review', label: 'Needs review' },
  { id: 'decided', label: 'Approved / Rejected' },
];
export default function Tabs({ active, onChange, counts }) {
  function keydown(event, index) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % 3
        : event.key === 'ArrowLeft'
          ? (index + 2) % 3
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? 2
              : null;
    if (next !== null) {
      event.preventDefault();
      onChange(tabs[next].id);
      document.getElementById(`tab-${tabs[next].id}`).focus();
    }
  }
  return (
    <div
      role="tablist"
      aria-label="Invoice status"
      className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-3 sm:px-5"
    >
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={active === tab.id}
          aria-controls="invoice-panel"
          tabIndex={active === tab.id ? 0 : -1}
          onKeyDown={(e) => keydown(e, index)}
          onClick={() => onChange(tab.id)}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-xs font-semibold transition-all sm:px-4 ${
            active === tab.id
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
          <span
            className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
              active === tab.id
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-200/80 text-slate-500'
            }`}
          >
            {counts[tab.id] ?? '—'}
          </span>
        </button>
      ))}
    </div>
  );
}
