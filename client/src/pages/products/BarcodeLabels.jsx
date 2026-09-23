import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { productApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import SearchBox from '../../components/SearchBox';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import useDebounce from '../../hooks/useDebounce';
import { formatRupees } from '../../utils/format';

export default function BarcodeLabels() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const debounced = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['products', 'labels', debounced],
    queryFn: () => productApi.list({ search: debounced, limit: 60 }).then((r) => r.data.data),
  });

  const allVariants = (data?.items || []).flatMap((p) =>
    (p.variants || [])
      .filter((v) => v.barcode || v.sku)
      .map((v) => ({ ...v, product: p }))
  );

  const toggle = (vid) =>
    setSelected((s) => (s.includes(vid) ? s.filter((x) => x !== vid) : [...s, vid]));
  const selectAll = () =>
    setSelected(allVariants.length === selected.length ? [] : allVariants.map((v) => v._id));

  const toPrint = allVariants.filter((v) => selected.includes(v._id));

  return (
    <div>
      <PageHeader title="Barcode Labels" subtitle="Select variants and print barcode label sheets"
        actions={
          <>
            <Link to="/products" className="btn-secondary">Back to Products</Link>
            <Button onClick={() => window.print()} disabled={!toPrint.length}><Printer className="h-4 w-4" /> Print {toPrint.length || ''} label(s)</Button>
          </>
        }
      />
      <div className="card p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <SearchBox className="flex-1 min-w-[220px]" value={search} onChange={setSearch} placeholder="Search products to print labels..." />
          <Button variant="secondary" size="sm" onClick={selectAll}>{selected.length === allVariants.length && allVariants.length ? 'Deselect' : 'Select all'}</Button>
        </div>
        {isLoading ? (
          <Skeleton rows={6} />
        ) : allVariants.length === 0 ? (
          <EmptyState title="No barcode variants found" description="Add barcodes to product variants to print labels." />
        ) : (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {allVariants.map((v) => (
              <label key={v._id} className={'flex cursor-pointer items-center gap-2 rounded-lg border p-2 ' + (selected.includes(v._id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50')}>
                <input type="checkbox" checked={selected.includes(v._id)} onChange={() => toggle(v._id)} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-700">{v.product.name}</div>
                  <div className="text-xs text-slate-400">{v.size?.name || 'Any'}/{v.color?.name || 'Any'} · {formatRupees(v.sellingPrice)}</div>
                  <div className="truncate font-mono text-[10px] text-slate-500">{v.barcode || v.sku}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div id="print-area" className="mt-4 hidden print:block">
        <div className="grid grid-cols-3 gap-3 p-4">
          {toPrint.map((v) => (
            <div key={v._id} className="rounded border border-slate-300 p-2 text-center">
              <div className="text-xs font-semibold text-slate-700">{v.product.name}</div>
              <div className="text-[10px] text-slate-500">{v.size?.name || ''} {v.color?.name || ''}</div>
              <div className="mx-auto my-1 h-8 w-40 border" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="font-mono text-[10px]">{v.barcode || v.sku}</span>
              </div>
              <div className="text-sm font-bold">{formatRupees(v.sellingPrice)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}