import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2, PackageSearch } from 'lucide-react';
import { purchaseApi, supplierApi, inventoryApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import SearchBox from '../../components/SearchBox';
import Modal from '../../components/Modal';
import useDebounce from '../../hooks/useDebounce';
import { formatRupees, todayISO } from '../../utils/format';

function ProductPicker({ onPick }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const { data, isFetching } = useQuery({
    queryKey: ['inventory', 'picker', debounced],
    queryFn: () => inventoryApi.list({ search: debounced, limit: 30 }).then((r) => r.data.data),
  });
  return (
    <div>
      <SearchBox value={search} onChange={setSearch} placeholder="Search product or SKU..." />
      <div className="mt-3 max-h-80 overflow-y-auto">
        {isFetching && <p className="p-3 text-xs text-slate-400">Loading...</p>}
        {(data?.items || []).map((v) => (
          <button key={v._id} onClick={() => onPick(v)} className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-slate-100">
            <div>
              <div className="text-sm font-medium text-slate-800">{v.product?.name || '-'}</div>
              <div className="text-xs text-slate-400">{v.size?.name || 'Any'} / {v.color?.name || 'Any'} · Stock: {v.stock}</div>
            </div>
            <div className="text-sm font-medium">{formatRupees(v.purchasePrice)}</div>
          </button>
        ))}
        {(data?.items || []).length === 0 && !isFetching && (
          <p className="p-3 text-xs text-slate-400">No products with stock found. You can still restock out-of-stock items by searching them.</p>
        )}
      </div>
    </div>
  );
}

export default function PurchaseForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [supplier, setSupplier] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayISO());
  const [discount, setDiscount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data: suppliers } = useQuery({ queryKey: ['suppliers', 'all'], queryFn: () => supplierApi.list({ limit: 100 }).then((r) => r.data.data) });

  const addItem = (v) => {
    const existing = items.find((i) => i.variant === v._id);
    if (existing) {
      setItems(items.map((i) => (i.variant === v._id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setItems([...items, { variant: v._id, name: v.product?.name || 'Item', sku: v.sku || v.product?.sku || '', unitPrice: (v.purchasePrice || 0) / 100, quantity: 1 }]);
    }
    toast.success('Added to purchase');
  };

  const subtotal = items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 0), 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const paid = Math.min(Number(paidAmount) || 0, total);

  const createMutation = useMutation({
    mutationFn: (payload) => purchaseApi.create(payload),
    onSuccess: (res) => {
      toast.success('Purchase recorded. Stock updated.');
      qc.invalidateQueries(['purchases']);
      qc.invalidateQueries(['inventory']);
      qc.invalidateQueries(['dashboard']);
      navigate(`/purchases/${res.data.data._id}`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save purchase'),
  });

  const submit = () => {
    if (!supplier) return toast.error('Select a supplier');
    if (!items.length) return toast.error('Add at least one item');
    createMutation.mutate({
      supplier,
      items: items.map((i) => ({ variant: i.variant, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
      discount: Number(discount) || 0,
      paidAmount: paid,
      paymentMethod,
      purchaseDate,
      notes: notes || undefined,
    });
  };

  return (
    <div>
      <PageHeader title="New Purchase" subtitle="Record stock coming in from a supplier"
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>} />
      <div className="card p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Select label="Supplier *" value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">Select supplier...</option>
            {suppliers?.items?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <Input label="Purchase Date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Items</h3>
            <p className="text-xs text-slate-400">Add products to stock</p>
          </div>
          <Button onClick={() => setPickerOpen(true)}><Plus className="h-4 w-4" /> Add Item</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3 w-24">Qty</th>
                <th className="px-5 py-3 w-36">Unit Price ₹</th>
                <th className="px-5 py-3 w-40 text-right">Line Total</th>
                <th className="px-5 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td className="px-5 py-3 text-sm">
                    <div className="font-medium text-slate-800">{i.name}</div>
                    <div className="text-xs text-slate-400">{i.sku || ''}</div>
                  </td>
                  <td className="px-5 py-3"><input className="input-base w-20" type="number" min="1" value={i.quantity} onChange={(e) => setItems(items.map((x) => x.variant === i.variant ? { ...x, quantity: e.target.value } : x))} /></td>
                  <td className="px-5 py-3"><input className="input-base w-28" type="number" min="0" step="0.01" value={i.unitPrice} onChange={(e) => setItems(items.map((x) => x.variant === i.variant ? { ...x, unitPrice: e.target.value } : x))} /></td>
                  <td className="px-5 py-3 text-right text-sm font-medium">{formatRupees((Number(i.unitPrice) || 0) * (Number(i.quantity) || 0) * 100)}</td>
                  <td className="px-5 py-3"><button onClick={() => setItems(items.filter((x) => x.variant !== i.variant))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="5" className="px-5 py-10 text-center text-sm text-slate-400">
                  <PackageSearch className="mx-auto mb-2 h-8 w-8 text-slate-300" />No items yet — click Add Item to select products.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-4 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Input label="Discount (₹)" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          <Input label="Amount Paying Now (₹)" type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
          <Select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </Select>
          <Input label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="mt-3 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Subtotal</span><span>{formatRupees(subtotal * 100)}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Discount</span><span>-{formatRupees((Number(discount) || 0) * 100)}</span></div>
          <div className="flex justify-between py-1 font-semibold text-slate-800"><span>Total</span><span>{formatRupees(total * 100)}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Paying now</span><span className="text-emerald-600">{formatRupees(paid * 100)}</span></div>
          <div className="flex justify-between py-0.5"><span className="text-slate-500">Due to supplier</span><span className={total - paid > 0 ? 'text-red-600' : ''}>{formatRupees((total - paid) * 100)}</span></div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button onClick={submit} loading={createMutation.isLoading}>Save Purchase</Button>
        </div>
      </div>

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title="Add Product to Purchase" size="lg">
        <ProductPicker onPick={(v) => { addItem(v); }} />
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setPickerOpen(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}