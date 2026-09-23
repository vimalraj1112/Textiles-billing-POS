import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) {
    return total > 0 ? (
      <div className="py-3 text-center text-xs text-slate-400">{total} record(s)</div>
    ) : null;
  }
  const go = (p) => {
    if (p >= 1 && p <= pages) onPageChange(p);
  };
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-slate-500">
        Page {page} of {pages} · {total} record(s)
      </span>
      <div className="flex items-center gap-1">
        <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40" disabled={page <= 1} onClick={() => go(page - 1)} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = Math.min(pages, Math.max(1, page - 2 + i));
          return (
            <button
              key={p}
              onClick={() => go(p)}
              className={clsx(
                'min-w-8 rounded-lg border px-2 py-1 text-xs',
                p === page ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {p}
            </button>
          );
        })}
        <button className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-40" disabled={page >= pages} onClick={() => go(page + 1)} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}