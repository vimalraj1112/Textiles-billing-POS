import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Activity, SlidersHorizontal } from 'lucide-react';
import { inventoryApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { StockBadge } from '../../components/Badge';
import { formatRupees } from '../../utils/format';
import useDebounce from '../../hooks/useDebounce';

export default function Inventory() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const debounced = useDebounce(search, 400);
  const [adjustFor, setAdjustFor] = useState(null);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', page, debounced, stockStatus],
    queryFn: () => inventoryApi.list({ page, limit: 15, search: debounced, stockStatus: stockStatus || undefined }).then((r) => r.data.data),
  });

  const adjustMutation = useMutation({
    mutationFn: inventoryApi.adjust,
    onSuccess: () => {
      toast.success('Stock adjusted');
      qc.invalidateQueries(['inventory']);
      qc.invalidateQueries(['dashboard']);
      setAdjustFor(null);
      setQty('');
      setReason('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Adjustment failed'),
  });

  const columns = [
    { key: 'product', label: 'Product', render: (v) => <div><div className="font-medium text-slate-800">{v.product?.name || '-'}</div><div className="text-xs text-slate-400">{v.product?.sku || v.sku || '-'}</div></div> },
    { key: 'variant', label: 'Variant', render: (v) => <span>{v.size?.name || 'Any'} / {v.color?.name || 'Any'}</span> },
    { key: 'stock', label: 'Current Stock', render: (v) => <span className="font-semibold">{v.stock}</span> },
    { key: 'min', label: 'Min', render: (v) => v.minimumStock || v.product?.minimumStock || 0 },
    {
      key: 'purchase',
      label: 'Purchase Price',
      render: (v) => formatRupees(v.purchasePrice),
    },
    {
      key: 'selling',
      label: 'Selling Price',
      render: (v) => <span className="font-medium">{formatRupees(v.sellingPrice)}</span>,
    },
    {
      key: 'value',
      label: 'Stock Value',
      render: (v) => <span className="font-medium">{formatRupees(v.stock * v.purchasePrice)}</span>,
    },
    { key: 'status', label: 'Status', render: (v) => <StockBadge status={v.stockStatus} /> },
    {
      key: 'actions',
      label: '',
      render: (v) => (
        <button className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={(e) => { e.stopPropagation(); setAdjustFor(v); }}>
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Stock levels and values across all variants"
        actions={<Link to="/inventory/movements" className="btn-secondary"><Activity className="h-4 w-4" /> Stock Movements</Link>} />
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchBox className="flex-1 min-w-[220px]" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search product, SKU..." />
          <Select className="w-44" value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No inventory records" description="Variant stock will appear here as you add products and make purchases." />
        ) : (
          <>
            <Table columns={columns} data={data.items} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={!!adjustFor} onClose={() => setAdjustFor(null)} title="Adjust Stock" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAdjustFor(null)}>Cancel</Button>
            <Button onClick={() => adjustMutation.mutate({ variantId: adjustFor._id, quantity: Number(qty), reason, allowNegative: false })} loading={adjustMutation.isLoading}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            <strong>{adjustFor?.product?.name}</strong> — current stock: <strong>{adjustFor?.stock}</strong>
          </p>
          <Input label="Quantity change (+ add / - reduce)" type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="e.g. +10 or -5" />
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damage, cycle count..." />
        </div>
      </Modal>
    </div>
  );
}