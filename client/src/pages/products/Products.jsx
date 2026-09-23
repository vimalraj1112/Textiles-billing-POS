import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, Tags } from 'lucide-react';
import { productApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Select from '../../components/Select';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { StockBadge } from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatRupees } from '../../utils/format';
import useDebounce from '../../hooks/useDebounce';

export default function Products() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const debounced = useDebounce(search, 400);
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, limit, debounced, stockStatus],
    queryFn: () => productApi.list({ page, limit, search: debounced, stockStatus: stockStatus || undefined }).then((r) => r.data.data),
  });

  const delMutation = useMutation({
    mutationFn: productApi.remove,
    onSuccess: () => {
      toast.success('Product deleted');
      qc.invalidateQueries(['products']);
      setToDelete(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete product'),
  });

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img src={p.images[0].startsWith('http') ? p.images[0] : `/uploads/${p.images[0].replace('/uploads/', '')}`} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Tags className="h-4 w-4" /></div>
          )}
          <div>
            <div className="font-medium text-slate-800">{p.name}</div>
            <div className="text-xs text-slate-400">{p.sku || 'no SKU'}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category', render: (p) => p.category?.name || '-' },
    {
      key: 'price',
      label: 'Selling Price',
      render: (p) => <span className="font-medium">{formatRupees(p.sellingPrice)}</span>,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (p) => (
        <div>
          <div>{p.totalStock}</div>
          <div className="text-xs text-slate-400">{p.variants?.length || 0} variant(s)</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (p) => {
        if (p.totalStock === 0) return <StockBadge status="OUT_OF_STOCK" />;
        const min = Math.min(...(p.variants || []).map((v) => v.minimumStock || 0));
        return <StockBadge status={p.totalStock <= min ? 'LOW_STOCK' : 'IN_STOCK'} />;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Link to={`/products/${p._id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><Eye className="h-4 w-4" /></Link>
          <Link to={`/products/${p._id}/edit`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></Link>
          <button onClick={() => setToDelete(p)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your catalogue, variants and pricing"
        actions={
          <>
            <Link to="/products/barcode-labels" className="btn-secondary">Barcode Labels</Link>
            <Link to="/products/new" className="btn-primary"><Plus className="h-4 w-4" /> New Product</Link>
          </>
        }
      />
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchBox className="flex-1 min-w-[200px]" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, SKU, barcode..." />
          <Select className="w-44" value={stockStatus} onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}>
            <option value="">All Stock</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </Select>
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No products found" description="Add your first product to start billing on POS." action={<Link to="/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add Product</Link>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} onRowClick={(p) => navigate(`/products/${p._id}`)} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
      <ConfirmDialog
        open={!!toDelete}
        title="Delete Product?"
        message={`${toDelete?.name} will be permanently removed. Products with sales history cannot be deleted.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => delMutation.mutate(toDelete._id)}
        loading={delMutation.isLoading}
      />
    </div>
  );
}