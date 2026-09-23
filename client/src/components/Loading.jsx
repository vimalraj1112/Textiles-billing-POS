import { Loader2 } from 'lucide-react';

export function Spinner({ fullPage = true }) {
  return (
    <div className={fullPage ? 'flex h-64 items-center justify-center' : 'flex items-center justify-center'}>
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );
}

export function Skeleton({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 w-1/4 rounded bg-slate-200" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-8 rounded bg-slate-100" />
      ))}
    </div>
  );
}