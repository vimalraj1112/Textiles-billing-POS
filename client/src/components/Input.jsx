import clsx from 'clsx';

export default function Input({ label, error, className, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      )}
      <input className={clsx('input-base', error && 'border-red-400', className)} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}