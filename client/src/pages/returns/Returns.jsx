import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Truck, Receipt } from 'lucide-react';
import { returnApi, saleApi, purchaseApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchBox from '../../components/SearchBox';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { formatRupees, formatDate } from '../../utils/format';
import { RETURN_REASONS, RETURN_ACTIONS } from '../../constants/masters';
import useDebounce from '../../hooks/useDebounce';

function SalesReturnFlow({ preselectedSaleId, onDone }) {
  const qc = useQueryClient();
  const [saleId, setSaleId] = useState(preselectedSaleId || '');
  const [saleSearch, setSaleSearch] = useState('');
  const debounced = useDebounce(saleSearch, 400);
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [action, setAction] = useState(RETURN_ACTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [note, setNote] = useState('');

  const { data: sales } = useQuery({
    queryKey: ['sales', 'list', debounced],
    queryFn: () => saleApi.list({ search: debounced, status: 'COMPLETED', limit: 20 }).then((r) => r.data.data),
    enabled: !saleId,
  });

  const { data: sale, isLoading } = useQuery({
    queryKey: ['returnable', saleId],
    queryFn: () => returnApi.validateReturnable(saleId).then((r) => r.data.data),
    enabled: !!saleId,
  });

  const mutation = useMutation({
    mutationFn: (payload) => returnApi.createSalesReturn(payload),
    onSuccess: () => {
      toast.success('Return processed. Stock updated.');
      qc.invalidateQueries(['salesReturns']);
      qc.invalidateQueries(['inventory']);
      qc.invalidateQueries(['customer']);
      onDone();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Return failed'),
  });

  const returnableItems = (sale?.items || []).filter((it) => it.returnableQty > 0);
  const selectedItems = returnableItems.filter((it) => (Number(quantities[it._id]) || 0) > 0);
  const refund = selectedItems.reduce((s, it) => s + Math.round(((it.subtotal / it.quantity) * (Number(quantities[it._id]) || 0))), 0);

  const submit = () => {
    if (!saleId) return toast.error('Select a sale invoice');
    if (!selectedItems.length) return toast.error('Select at least one item to return');
    mutation.mutate({
      sale: saleId,
      items: selectedItems.map((it) => ({ variant: it.variant, quantity: Number(quantities[it._id]) })),
      reason,
      action,
      paymentMethod: action === 'REFUND' ? paymentMethod : undefined,
      note: note || undefined,
    });
  };

  return (
    <div className="space-y-4">
      {!saleId ? (
        <div>
          <SearchBox value={saleSearch} onChange={setSaleSearch} placeholder="Search invoice number..." />
          <div className="mt-3 max-h-64 overflow-y-auto">
            {(sales?.items || []).map((s) => (
              <button key={s._id} onClick={() => setSaleId(s._id)} className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-800">{s.invoiceNumber}</div>
                  <div className="text-xs text-slate-400">{formatDate(s.saleDate)} · {s.customer?.name || 'Walk-in'}</div>
                </div>
                <div className="text-sm font-medium">{formatRupees(s.grandTotal)}</div>
              </button>
            ))}
            {(sales?.items || []).length === 0 && <p className="p-3 text-xs text-slate-400">No completed sales found.</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-700">{sale?.invoiceNumber}</span>
              <span className="ml-2 text-xs text-slate-400">{sale?.customer?.name || 'Walk-in'}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSaleId('')}>Change invoice</Button>
          </div>
          {isLoading ? (
            <Skeleton rows={3} />
          ) : returnableItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No returnable items on this invoice.</p>
          ) : (
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Sold</th>
                  <th className="px-3 py-2">Returned</th>
                  <th className="px-3 py-2 w-28">Return Qty</th>
                  <th className="px-3 py-2 text-right">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returnableItems.map((it) => (
                  <tr key={it._id}>
                    <td className="px-3 py-2 text-sm"><span className="font-medium">{it.name}</span><div className="text-xs text-slate-400">{it.sku}</div></td>
                    <td className="px-3 py-2 text-sm">{it.quantity}</td>
                    <td className="px-3 py-2 text-sm">{it.returnedQty}</td>
                    <td className="px-3 py-2"><input className="input-base" type="number" min="0" max={it.returnableQty} value={quantities[it._id] || ''} onChange={(e) => setQuantities({ ...quantities, [it._id]: e.target.value })} /></td>
                    <td className="px-3 py-2 text-right text-sm font-medium">{formatRupees(Math.round((it.subtotal / it.quantity) * (Number(quantities[it._id]) || 0)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="grid gap-3 md:grid-cols-3">
            <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>{RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
            <Select label="Action" value={action} onChange={(e) => setAction(e.target.value)}>{RETURN_ACTIONS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
            {action === 'REFUND' ? (
              <Select label="Refund Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option>
              </Select>
            ) : <div />}
          </div>
          <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
            <span className="text-sm text-blue-700">Refund Amount</span>
            <span className="text-lg font-bold text-blue-700">{formatRupees(refund)}</span>
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} loading={mutation.isLoading}>Process Return</Button>
          </div>
        </>
      )}
    </div>
  );
}

function PurchaseReturnFlow({ onDone }) {
  const qc = useQueryClient();
  const [purchaseId, setPurchaseId] = useState('');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [quantities, setQuantities] = useState({});
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [note, setNote] = useState('');

  const { data: purchases } = useQuery({
    queryKey: ['purchases', 'list', debounced],
    queryFn: () => purchaseApi.list({ search: debounced, limit: 20 }).then((r) => r.data.data),
    enabled: !purchaseId,
  });

  const { data: purchase, isLoading } = useQuery({
    queryKey: ['purchase', purchaseId],
    queryFn: () => purchaseApi.get(purchaseId).then((r) => r.data.data),
    enabled: !!purchaseId,
  });

  const mutation = useMutation({
    mutationFn: (payload) => returnApi.createPurchaseReturn(payload),
    onSuccess: () => {
      toast.success('Purchase return recorded. Stock updated.');
      qc.invalidateQueries(['purchaseReturns']);
      onDone();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Return failed'),
  });

  const items = purchase?.items || [];
  const selected = items.filter((it) => (Number(quantities[it._id]) || 0) > 0);
  const refund = selected.reduce((s, it) => s + Math.round((it.unitPrice / it.quantity) * (Number(quantities[it._id]) || 0)), 0);

  const submit = () => {
    if (!purchaseId) return toast.error('Select a purchase');
    if (!selected.length) return toast.error('Select items to return');
    mutation.mutate({ purchase: purchaseId, items: selected.map((it) => ({ purchaseItem: it._id, quantity: Number(quantities[it._id]) })), reason, note: note || undefined });
  };

  return (
    <div className="space-y-4">
      {!purchaseId ? (
        <div>
          <SearchBox value={search} onChange={setSearch} placeholder="Search purchase number..." />
          <div className="mt-3 max-h-64 overflow-y-auto">
            {(purchases?.items || []).map((p) => (
              <button key={p._id} onClick={() => setPurchaseId(p._id)} className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-800">{p.purchaseNumber}</div>
                  <div className="text-xs text-slate-400">{formatDate(p.purchaseDate)} · {p.supplier?.name || '-'}</div>
                </div>
                <div className="text-sm font-medium">{formatRupees(p.total)}</div>
              </button>
            ))}
            {(purchases?.items || []).length === 0 && <p className="p-3 text-xs text-slate-400">No purchases found.</p>}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">{purchase?.purchaseNumber}</span>
            <Button variant="ghost" size="sm" onClick={() => setPurchaseId('')}>Change purchase</Button>
          </div>
          {isLoading ? <Skeleton rows={3} /> : (
            <table className="w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs text-slate-500">
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Purchased</th>
                  <th className="px-3 py-2 w-28">Return Qty</th>
                  <th className="px-3 py-2 text-right">Return Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it._id}>
                    <td className="px-3 py-2 text-sm"><span className="font-medium">{it.name}</span><div className="text-xs text-slate-400">{it.sku}</div></td>
                    <td className="px-3 py-2 text-sm">{it.quantity}</td>
                    <td className="px-3 py-2"><input className="input-base" type="number" min="0" max={it.quantity} value={quantities[it._id] || ''} onChange={(e) => setQuantities({ ...quantities, [it._id]: e.target.value })} /></td>
                    <td className="px-3 py-2 text-right text-sm font-medium">{formatRupees(Math.round((it.unitPrice / it.quantity) * (Number(quantities[it._id]) || 0)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>{RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</Select>
          <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
            <span className="text-sm text-blue-700">Return Value</span>
            <span className="text-lg font-bold text-blue-700">{formatRupees(refund)}</span>
          </div>
          <div className="flex justify-end"><Button onClick={submit} loading={mutation.isLoading}>Record Return</Button></div>
        </>
      )}
    </div>
  );
}

export default function Returns() {
  const location = useLocation();
  const [tab, setTab] = useState('sale');
  const [salesPage, setSalesPage] = useState(1);
  const [purchPage, setPurchPage] = useState(1);
  const [flow, setFlow] = useState(null); // 'sale' | 'purchase'

  const { data: sRet, isLoading: l1 } = useQuery({
    queryKey: ['salesReturns', salesPage],
    queryFn: () => returnApi.salesList({ page: salesPage, limit: 15 }).then((r) => r.data.data),
  });
  const { data: pRet, isLoading: l2 } = useQuery({
    queryKey: ['purchaseReturns', purchPage],
    queryFn: () => returnApi.purchaseReturns({ page: purchPage, limit: 15 }).then((r) => r.data.data),
  });

  const openSalesFlow = () => setFlow({ type: 'sale', saleId: location.state?.saleId });

  return (
    <div>
      <PageHeader title="Returns" subtitle="Sales and purchase returns"
        actions={
          tab === 'sale'
            ? <Button onClick={openSalesFlow}><Plus className="h-4 w-4" /> New Sales Return</Button>
            : <Button onClick={() => setFlow({ type: 'purchase' })}><Plus className="h-4 w-4" /> New Purchase Return</Button>
        }
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button onClick={() => setTab('sale')} className={'flex-1 rounded-md px-3 py-2 text-sm font-medium ' + (tab === 'sale' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500')}>Sales Returns</button>
        <button onClick={() => setTab('purchase')} className={'flex-1 rounded-md px-3 py-2 text-sm font-medium ' + (tab === 'purchase' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500')}>Purchase Returns</button>
      </div>

      <div className="card">
        {tab === 'sale' ? (
          l1 ? <Skeleton rows={6} /> : !sRet || sRet.items.length === 0 ? (
            <EmptyState title="No sales returns" description="Returns on invoices appear here." action={<Button onClick={openSalesFlow}><Plus className="h-4 w-4" /> New Sales Return</Button>} />
          ) : (
            <>
              <ReturnTable rows={sRet.items} type="sale" />
              <Pagination page={sRet.page} pages={sRet.pages} total={sRet.total} onPageChange={setSalesPage} />
            </>
          )
        ) : l2 ? <Skeleton rows={6} /> : !pRet || pRet.items.length === 0 ? (
          <EmptyState title="No purchase returns" description="Returns to suppliers appear here." action={<Button onClick={() => setFlow({ type: 'purchase' })}><Plus className="h-4 w-4" /> New Purchase Return</Button>} />
        ) : (
          <>
            <ReturnTable rows={pRet.items} type="purchase" />
            <Pagination page={pRet.page} pages={pRet.pages} total={pRet.total} onPageChange={setPurchPage} />
          </>
        )}
      </div>

      <Modal open={!!flow} onClose={() => setFlow(null)} title={flow?.type === 'sale' ? 'New Sales Return' : 'New Purchase Return'} size="lg">
        {flow?.type === 'sale' ? <SalesReturnFlow preselectedSaleId={flow.saleId} onDone={() => setFlow(null)} /> : <PurchaseReturnFlow onDone={() => setFlow(null)} />}
      </Modal>
    </div>
  );
}

function ReturnTable({ rows, type }) {
  const Icon = type === 'sale' ? Receipt : Truck;
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs text-slate-500">
            <th className="px-5 py-3">Return No.</th>
            <th className="px-5 py-3">{type === 'sale' ? 'Invoice' : 'Purchase'}</th>
            <th className="px-5 py-3">Date</th>
            <th className="px-5 py-3">Items</th>
            <th className="px-5 py-3">Reason</th>
            <th className="px-5 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r._id}>
              <td className="px-5 py-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium text-blue-600"><Icon className="h-4 w-4" />{r.returnNumber}</span>
              </td>
              <td className="px-5 py-3 text-sm">{type === 'sale' ? r.sale?.invoiceNumber || '-' : r.purchase?.purchaseNumber || '-'}</td>
              <td className="px-5 py-3 text-sm">{formatDate(r.returnedAt)}</td>
              <td className="px-5 py-3 text-sm">{r.items?.length || 0}</td>
              <td className="px-5 py-3 text-sm"><Badge color="slate">{r.reason}</Badge></td>
              <td className="px-5 py-3 text-right text-sm font-medium text-red-600">{formatRupees(r.refundAmount || r.returnAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}