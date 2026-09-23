import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Truck, Wallet } from 'lucide-react';
import { purchaseApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import { PaymentBadge } from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatRupees, formatDate } from '../../utils/format';

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');

  const { data: p, isLoading, isError, refetch } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => purchaseApi.get(id).then((r) => r.data.data),
  });

  const payMutation = useMutation({
    mutationFn: () => purchaseApi.pay(id, { amount: Number(amount), method }),
    onSuccess: () => {
      toast.success('Payment recorded');
      qc.invalidateQueries(['purchase', id]);
      qc.invalidateQueries(['purchases']);
      setPayOpen(false);
      setAmount('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Payment failed'),
  });

  if (isLoading) return <Skeleton rows={8} />;
  if (isError) return <ErrorState message="Purchase not found" onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={p.purchaseNumber} subtitle={`${p.supplier?.name || '-'} · ${formatDate(p.purchaseDate)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            {p.dueAmount > 0 && <Button onClick={() => { setAmount((p.dueAmount / 100).toFixed(2)); setPayOpen(true); }}><Wallet className="h-4 w-4" /> Pay Due ₹{formatRupees(p.dueAmount)}</Button>}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4"><div className="text-xs text-slate-500">Subtotal</div><div className="mt-1 font-semibold">{formatRupees(p.subtotal)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Discount</div><div className="mt-1 font-semibold">-{formatRupees(p.discount)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Paid</div><div className="mt-1 font-semibold text-emerald-600">{formatRupees(p.paidAmount)}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-500">Due</div><div className="mt-1 font-semibold text-red-600">{formatRupees(p.dueAmount)}</div></div>
      </div>

      <div className="card mt-5">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-700">Purchase Items</h3></div>
          <PaymentBadge status={p.paymentStatus} />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Size / Color</th>
                <th className="px-5 py-3">Qty</th>
                <th className="px-5 py-3">Unit Price</th>
                <th className="px-5 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(p.items || []).map((it) => (
                <tr key={it._id}>
                  <td className="px-5 py-3 text-sm"><div className="font-medium text-slate-800">{it.name}</div><div className="text-xs text-slate-400">{it.sku || ''}</div></td>
                  <td className="px-5 py-3 text-sm">{it.size || 'Any'} / {it.color || 'Any'}</td>
                  <td className="px-5 py-3 text-sm">{it.quantity}</td>
                  <td className="px-5 py-3 text-sm">{formatRupees(it.unitPrice)}</td>
                  <td className="px-5 py-3 text-right text-sm font-medium">{formatRupees(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 text-sm">
                <td colSpan="4" className="px-5 py-3 text-right font-medium text-slate-600">Total ({formatDate(p.purchaseDate)})</td>
                <td className="px-5 py-3 text-right font-semibold">{formatRupees(p.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {p.notes && <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Notes: {p.notes}</p>}
      </div>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record Payment" size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={() => payMutation.mutate()} loading={payMutation.isLoading}>Record</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Due remaining: <strong>{formatRupees(p.dueAmount)}</strong></p>
          <Input label="Amount (₹)" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Select label="Method" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}