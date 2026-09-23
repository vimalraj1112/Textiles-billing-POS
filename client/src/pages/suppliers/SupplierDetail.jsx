import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { supplierApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatRupees, formatDate } from '../../utils/format';

function Stat({ label, value, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={'mt-1 text-lg font-semibold ' + (accent || 'text-slate-800')}>{value}</div>
    </div>
  );
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: s, isLoading, isError, refetch } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierApi.get(id).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={8} />;
  if (isError) return <ErrorState message="Supplier not found" onRetry={refetch} />;

  const summary = s.summary || { totalPurchases: 0, totalPaid: 0, totalDue: 0 };

  return (
    <div>
      <PageHeader title={s.name} subtitle={s.companyName || 'Supplier'}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            <Button onClick={() => navigate('/purchases/new')}>Record Purchase</Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Purchases" value={formatRupees(summary.totalPurchases)} />
        <Stat label="Total Paid" value={formatRupees(summary.totalPaid)} accent="text-emerald-600" />
        <Stat label="Total Due" value={formatRupees(summary.totalDue)} accent={summary.totalDue > 0 ? 'text-red-600' : 'text-slate-800'} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 className="h-4 w-4" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Contact Details</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{s.phone || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{s.email || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">GSTIN</dt><dd>{s.gstNumber || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">City</dt><dd>{s.city || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><Badge color={s.status === 'ACTIVE' ? 'green' : 'slate'}>{s.status}</Badge></dd></div>
          </dl>
          {s.address && <p className="mt-3 text-xs text-slate-500">{s.address}, {s.city} {s.pincode}</p>}
          {s.notes && <p className="mt-2 text-xs text-slate-500">Note: {s.notes}</p>}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-700">Recent Purchases</h3>
            <Link to="/purchases" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-5 py-3">Number</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Paid</th>
                  <th className="px-5 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(s.purchases || []).map((p) => (
                  <tr key={p._id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/purchases/${p._id}`)}>
                    <td className="px-5 py-3 text-sm font-medium text-blue-600">{p.purchaseNumber}</td>
                    <td className="px-5 py-3 text-sm">{formatDate(p.purchaseDate)}</td>
                    <td className="px-5 py-3 text-sm">{p.items?.length || 0}</td>
                    <td className="px-5 py-3 text-sm font-medium">{formatRupees(p.total)}</td>
                    <td className="px-5 py-3 text-sm text-emerald-600">{formatRupees(p.paidAmount)}</td>
                    <td className="px-5 py-3 text-sm text-red-600">{formatRupees(p.dueAmount)}</td>
                  </tr>
                ))}
                {(s.purchases || []).length === 0 && (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-400">No purchases yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}