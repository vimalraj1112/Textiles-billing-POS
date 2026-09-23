import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Printer, Ban, Repeat } from 'lucide-react';
import { saleApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Badge, { PaymentBadge } from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatRupees } from '../../utils/format';
import InvoiceReceipt from '../pos/InvoiceReceipt';

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [voidOpen, setVoidOpen] = useState(false);

  const { data: s, isLoading, isError, refetch } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => saleApi.get(id).then((r) => r.data.data),
  });

  const voidMutation = useMutation({
    mutationFn: () => saleApi.void(id),
    onSuccess: () => {
      toast.success('Invoice voided. Stock restored.');
      qc.invalidateQueries(['sale', id]);
      setVoidOpen(false);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not void invoice'),
  });

  if (isLoading) return <Skeleton rows={8} />;
  if (isError) return <ErrorState message="Sale not found" onRetry={refetch} />;

  return (
    <div>
      <PageHeader title={s.invoiceNumber} subtitle={s.customer?.name ? `${s.customer.name} · ${s.customer.phone || ''}` : 'Walk-in customer'}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            <Button onClick={() => window.print()} disabled={s.status !== 'COMPLETED'}><Printer className="h-4 w-4" /> Print Invoice</Button>
            <Button variant="secondary" onClick={() => navigate('/returns', { state: { saleId: id } })} disabled={s.status !== 'COMPLETED'}><Repeat className="h-4 w-4" /> Return</Button>
            {s.status === 'COMPLETED' && (
              <Button variant="danger" onClick={() => setVoidOpen(true)}><Ban className="h-4 w-4" /> Void</Button>
            )}
          </>
        }
      />

      {!voidMutation.isSuccess && (
        <div className="card p-5">
          <PreviewItems s={s} />
        </div>
      )}

      <div id="print-area" className="hidden print:block">{s && <InvoiceReceipt sale={s} />}</div>

      <ConfirmDialog
        open={voidOpen}
        title="Void this invoice?"
        message={`${s.invoiceNumber} (₹${formatRupees(s.grandTotal)}) will be marked VOID and all items restocked. This cannot be undone.`}
        onClose={() => setVoidOpen(false)}
        onConfirm={() => voidMutation.mutate()}
        loading={voidMutation.isLoading}
      />
    </div>
  );
}

function PreviewItems({ s }) {
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div><span className="text-slate-500">Date:</span> <span className="font-medium">{new Date(s.saleDate).toLocaleString('en-IN')}</span></div>
        <div><span className="text-slate-500">Cashier:</span> <span className="font-medium">{s.cashier?.name || '-'}</span></div>
        <div><span className="text-slate-500">Status:</span> <Badge color={s.status === 'COMPLETED' ? 'green' : s.status === 'HELD' ? 'amber' : 'red'}>{s.status}</Badge></div>
        <div><span className="text-slate-500">Payment:</span> <PaymentBadge status={s.paymentStatus} /></div>
        {s.isCredit && <div><Badge color="amber">Credit Sale</Badge></div>}
        {s.loyaltyPointsEarned > 0 && <div><Badge color="purple">+{s.loyaltyPointsEarned} loyalty pts</Badge></div>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-5 py-3">Item</th>
              <th className="px-5 py-3">Size / Color</th>
              <th className="px-5 py-3">Qty</th>
              <th className="px-5 py-3">Rate</th>
              <th className="px-5 py-3">Disc</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(s.items || []).map((it) => (
              <tr key={it._id}>
                <td className="px-5 py-3 text-sm"><span className="font-medium text-slate-800">{it.name}</span><div className="text-xs text-slate-400">{it.sku || ''}</div></td>
                <td className="px-5 py-3 text-sm">{it.size || 'Any'} / {it.color || 'Any'}</td>
                <td className="px-5 py-3 text-sm">{it.quantity}</td>
                <td className="px-5 py-3 text-sm">{formatRupees(it.unitPrice)}</td>
                <td className="px-5 py-3 text-sm text-red-500">{it.discount > 0 ? `-${formatRupees(it.discount)}` : '-'}</td>
                <td className="px-5 py-3 text-right text-sm font-medium">{formatRupees(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 text-sm">
              <td colSpan="5" className="px-5 py-3 text-right font-medium text-slate-600">Subtotal</td>
              <td className="px-5 py-3 text-right">{formatRupees(s.subtotal)}</td>
            </tr>
            {s.discount > 0 && (
              <tr className="bg-slate-50 text-sm">
                <td colSpan="5" className="px-5 py-2 text-right font-medium text-slate-600">Discount</td>
                <td className="px-5 py-2 text-right text-red-600">-{formatRupees(s.discount)}</td>
              </tr>
            )}
            <tr className="bg-slate-50 text-sm">
              <td colSpan="5" className="px-5 py-3 text-right font-semibold text-slate-800">Grand Total</td>
              <td className="px-5 py-3 text-right font-bold">{formatRupees(s.grandTotal)}</td>
            </tr>
            <tr className="text-sm">
              <td colSpan="5" className="px-5 py-2 text-right font-medium text-slate-600">Paid</td>
              <td className="px-5 py-2 text-right text-emerald-600">{formatRupees(s.amountPaid)}</td>
            </tr>
            {s.amountDue > 0 && (
              <tr className="text-sm">
                <td colSpan="5" className="px-5 py-2 text-right font-medium text-slate-600">Balance Due</td>
                <td className="px-5 py-2 text-right text-red-600">{formatRupees(s.amountDue)}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      {(s.payments || []).length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <h4 className="mb-2 text-xs font-semibold text-slate-500">PAYMENTS</h4>
          <div className="space-y-1 text-sm">
            {(s.payments || []).map((pm) => (
              <div key={pm._id} className="flex justify-between">
                <span>{pm.method}{pm.reference ? ` · ${pm.reference}` : ''}</span>
                <span className="font-medium">{formatRupees(pm.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {(s.returns || []).length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <h4 className="mb-2 text-xs font-semibold text-slate-500">RETURNS ON THIS INVOICE</h4>
          <div className="space-y-1 text-sm text-red-600">
            {(s.returns || []).map((r) => (
              <div key={r._id} className="flex justify-between">
                <span>{r.returnNumber} ({r.reason})</span>
                <span>-{formatRupees(r.refundAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {s.notes && <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">Notes: {s.notes}</p>}
    </div>
  );
}