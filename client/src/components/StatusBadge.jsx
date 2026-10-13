const statusConfig = {
  processing: {
    label: 'Processing',
    badge: 'bg-amber-50/90 text-amber-800 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  needs_review: {
    label: 'Needs review',
    badge: 'bg-orange-50/90 text-orange-800 border-orange-200/80',
    dot: 'bg-orange-500',
  },
  approved: {
    label: 'Approved',
    badge: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-50/90 text-rose-800 border-rose-200/80',
    dot: 'bg-rose-500',
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-sm ${config.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
