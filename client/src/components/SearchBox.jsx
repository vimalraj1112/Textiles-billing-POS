import { Search } from 'lucide-react';

export default function SearchBox({ value, onChange, placeholder = 'Search...', className }) {
  return (
    <div className={'relative ' + (className || '')}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-base pl-9"
      />
    </div>
  );
}