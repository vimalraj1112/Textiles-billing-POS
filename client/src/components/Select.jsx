import clsx from 'clsx';

export default function Select({ label, error, children, className, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      )}
      <select className={clsx('input-base', error && 'border-red-400', className)} {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}