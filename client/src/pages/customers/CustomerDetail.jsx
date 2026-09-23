import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, Gift, Repeat } from 'lucide-react';
import { customerApi } from '../../api';
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

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: c, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.get(id).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={8} />;
  if (isError) return <ErrorState message="Customer not found" onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={c.name} subtitle={c.phone || c.email || 'Customer'}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>} />
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total Purchases" value={formatRupees(c.totalPurchases)} />
        <Stat label="Outstanding" value={formatRupees(c.outstandingAmount)} accent={c.outstandingAmount > 0 ? 'text-red-600' : 'text-slate-800'} />
        <Stat label="Loyalty Points" value={c.loyaltyPoints} />
        <Stat label="Member Since" value={formatDate(c.createdAt)} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><User className="h-4 w-4" /></div>
            <h3 className="text-sm font-semibold text-slate-700">Contact Details</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{c.phone || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{c.email || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">City</dt><dd>{c.city || '-'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd><Badge color={c.status === 'ACTIVE' ? 'green' : 'slate'}>{c.status}</Badge></dd></div>
          </dl>
          {c.address && <p className="mt-3 text-xs text-slate-500">{c.address}, {c.city} {c.pincode}</p>}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <User className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-700">Recent Sales</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(c.sales || []).map((s) => (
                  <tr key={s._id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/sales/${s._id}`)}>
                    <td className="px-5 py-3 text-sm font-medium text-blue-600">{s.invoiceNumber}</td>
                    <td className="px-5 py-3 text-sm">{formatDate(s.saleDate)}</td>
                    <td className="px-5 py-3 text-sm">{s.items?.length || 0}</td>
                    <td className="px-5 py-3 text-sm font-medium">{formatRupees(s.grandTotal)}</td>
                    <td className="px-5 py-3 text-sm text-red-600">{formatRupees(s.amountDue)}</td>
                  </tr>
                ))}
                {(c.sales || []).length === 0 && (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-400">No sales yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {((c.returns || []).length > 0 || (c.loyalty || []).length > 0) && (
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {c.returns?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <Repeat className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Returns</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {c.returns.map((r) => (
                  <div key={r._id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <div className="font-medium">{r.returnNumber}</div>
                      <div className="text-xs text-slate-400">{formatDate(r.returnedAt)}</div>
                    </div>
                    <div className="font-medium text-red-600">-{formatRupees(r.refundAmount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {c.loyalty?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                <Gift className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Loyalty History</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {c.loyalty.map((l) => (
                  <div key={l._id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div>
                      <div className="font-medium">{l.type === 'EARN' ? 'Earned' : 'Redeemed'}</div>
                      <div className="text-xs text-slate-400">{l.note || ''}</div>
                    </div>
                    <div className={l.points > 0 ? 'font-medium text-emerald-600' : 'font-medium text-red-600'}>
                      {l.points > 0 ? `+${l.points}` : l.points} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}