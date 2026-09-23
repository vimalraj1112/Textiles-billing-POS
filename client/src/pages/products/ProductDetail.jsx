import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Barcode } from 'lucide-react';
import { productApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge, { StockBadge } from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatRupees, formatDate } from '../../utils/format';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: p, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={10} />;
  if (isError) return <ErrorState message="Product not found" onRetry={refetch} />;

  const totalStock = (p.variants || []).reduce((s, v) => s + v.stock, 0);

  return (
    <div>
      <PageHeader title={p.name} subtitle={`SKU: ${p.sku || '—'} · Added ${formatDate(p.createdAt)}`}
        actions={
          <>
            <Link to="/products/barcode-labels" className="btn-secondary"><Barcode className="h-4 w-4" /> Labels</Link>
            <Button variant="secondary" onClick={() => navigate(`/products/${p._id}/edit`)}><Pencil className="h-4 w-4" /> Edit</Button>
            <Button onClick={() => navigate('/pos')}>Sell in POS</Button>
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Details</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Category</dt><dd>{p.category?.name || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Brand</dt><dd>{p.brand?.name || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Supplier</dt><dd>{p.supplier?.name || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Gender</dt><dd>{p.gender || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Material</dt><dd>{p.material || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Purchase Price</dt><dd>{formatRupees(p.purchasePrice)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Selling Price</dt><dd className="font-semibold">{formatRupees(p.sellingPrice)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Tax Rate</dt><dd>{p.taxRate}%</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><Badge color={p.status === 'ACTIVE' ? 'green' : 'slate'}>{p.status}</Badge></dd></div>
          </dl>
          {p.images?.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {p.images.map((img, i) => (
                <img key={i} src={img.startsWith('http') ? img : `/uploads/${img.replace('/uploads/', '')}`} alt="" className="rounded-lg object-cover" />
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">{p.description || 'No description.'}</p>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-700">Variants &amp; Stock</h3>
            <Badge color={totalStock === 0 ? 'red' : totalStock <= p.minimumStock ? 'amber' : 'green'}>
              {totalStock} units total
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-5 py-3">Size / Color</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Barcode</th>
                  <th className="px-5 py-3">Purchase</th>
                  <th className="px-5 py-3">Selling</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(p.variants || []).map((v) => (
                  <tr key={v._id}>
                    <td className="px-5 py-3 text-sm">{v.size?.name || 'Any'} / {v.color?.name || 'Any'}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{v.sku || '-'}</td>
                    <td className="px-5 py-3 text-sm text-slate-500">{v.barcode || '-'}</td>
                    <td className="px-5 py-3 text-sm">{formatRupees(v.purchasePrice)}</td>
                    <td className="px-5 py-3 text-sm font-medium">{formatRupees(v.sellingPrice)}</td>
                    <td className="px-5 py-3 text-sm">{v.stock}</td>
                    <td className="px-5 py-3"><StockBadge status={v.stock === 0 ? 'OUT_OF_STOCK' : v.stock <= (v.minimumStock || p.minimumStock) ? 'LOW_STOCK' : 'IN_STOCK'} /></td>
                  </tr>
                ))}
                {(p.variants || []).length === 0 && (
                  <tr><td colSpan="7" className="px-5 py-8 text-center text-sm text-slate-400">No variants</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}