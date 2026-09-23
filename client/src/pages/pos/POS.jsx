import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  ShoppingBag,
  CreditCard,
  PauseCircle,
  X,
  Printer,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { productApi, customerApi, saleApi, masterApi } from '../../api';
import { formatRupees } from '../../utils/format';
import { Spinner } from '../../components/Loading';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import useDebounce from '../../hooks/useDebounce';
import InvoiceReceipt from './InvoiceReceipt';

const EMPTY_CART = [];

export default function POS() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [category, setCategory] = useState('');
  const [cart, setCart] = useState(EMPTY_CART);
  const [customer, setCustomer] = useState(null);
  const [customerModal, setCustomerModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [holdModal, setHoldModal] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [billDiscount, setBillDiscount] = useState({ type: 'FIXED', value: 0 });
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const searchRef = useRef(null);
  const [adding, setAdding] = useState(null);

  const { data: productData, isLoading } = useQuery({
    queryKey: ['pos-products', debounced, category],
    queryFn: () => productApi.searchPOS({ search: debounced, category: category || undefined, limit: 24 }).then((r) => r.data.data),
  });

  const { data: cats } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => masterApi.list('categories', { limit: 100 }).then((r) => r.data.data),
  });

  const { data: heldBills } = useQuery({
    queryKey: ['held-bills'],
    queryFn: () => saleApi.held().then((r) => r.data.data),
    enabled: holdModal,
  });

  const holdMutation = useMutation({
    mutationFn: saleApi.hold,
    onSuccess: (res) => {
      toast.success(`Bill held: ${res.data.data.invoiceNumber}`);
      qc.invalidateQueries(['held-bills']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not hold bill'),
  });

  const completeMutation = useMutation({
    mutationFn: saleApi.create,
    onSuccess: (res) => {
      const sale = res.data.data;
      setCompletedSale(sale);
      setCart(EMPTY_CART);
      setCustomer(null);
      setBillDiscount({ type: 'FIXED', value: 0 });
      setCoupon('');
      setCouponApplied(null);
      setRedeemPoints(0);
      qc.invalidateQueries(['dashboard']);
      qc.invalidateQueries(['notifications']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not complete sale'),
  });

  const focusSearch = useCallback(() => searchRef.current?.focus(), []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setCustomerModal(false);
        setPaymentModal(false);
        setHoldModal(false);
      }
      if (e.key === 'F2') {
        e.preventDefault();
        focusSearch();
      }
      if (e.key === 'F4') {
        e.preventDefault();
        setCustomerModal(true);
      }
      if (e.key === 'F6') {
        e.preventDefault();
        setHoldModal(true);
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setPaymentModal(true);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (cart.length) setPaymentModal(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cart.length, focusSearch]);

  const addToCart = (product, variant) => {
    if (!variant) return;
    if (variant.stock <= 0) {
      toast.error('This variant is out of stock');
      return;
    }
    const key = variant._id;
    const existing = cart.find((l) => l.variantId === key);
    if (existing) {
      if (existing.qty + 1 > variant.stock) {
        toast.error('Quantity exceeds available stock');
        return;
      }
      setCart(cart.map((l) => (l.variantId === key ? { ...l, qty: l.qty + 1 } : l)));
    } else {
      setAdding(key);
      setTimeout(() => setAdding(null), 300);
      setCart([
        ...cart,
        {
          variantId: key,
          productId: product._id,
          name: product.name,
          sku: variant.sku || product.sku,
          size: variant.size?.name || '',
          color: variant.color?.name || '',
          unitPrice: variant.sellingPrice,
          qty: 1,
          itemDiscount: 0,
          stock: variant.stock,
        },
      ]);
    }
  };

  const onBarcodeAdd = (text) => {
    if (!text) return;
    const found = (productData?.items || []).find((p) =>
      p.variants.some((v) => v.barcode === text.trim())
    );
    if (!found) {
      toast.error('No product found for this barcode');
      return;
    }
    const variant = found.variants.find((v) => v.barcode === text.trim()) || found.variants[0];
    addToCart(found, variant);
  };

  const changeQty = (variantId, delta) => {
    setCart(
      cart.map((l) => {
        if (l.variantId !== variantId) return l;
        const next = l.qty + delta;
        if (next < 1) return l;
        if (next > l.stock) {
          toast.error('Quantity exceeds available stock');
          return l;
        }
        return { ...l, qty: next, itemDiscount: (l.itemDiscount / l.qty) * next };
      })
    );
  };

  const removeItem = (variantId) => setCart(cart.filter((l) => l.variantId !== variantId));
  const clearCart = () => setCart(EMPTY_CART);

  const itemsSubtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const itemsDiscount = cart.reduce(
    (s, l) => s + Math.min(l.itemDiscount, l.unitPrice * l.qty),
    0
  );
  const billDisc = Math.min(
    billDiscount.type === 'PERCENT'
      ? Math.round(((itemsSubtotal || 0) * Math.min(billDiscount.value, 100)) / 100)
      : billDiscount.value * 100,
    itemsSubtotal - itemsDiscount
  );
  const couponDisc = (() => {
    if (!couponApplied) return 0;
    const cap = Math.max(0, itemsSubtotal - itemsDiscount - billDisc);
    if (couponApplied.discountType === 'PERCENT') {
      return Math.min(Math.round((cap * Math.min(couponApplied.discountValue, 100)) / 100), couponApplied.maximumDiscount * 100 || cap);
    }
    return Math.min(couponApplied.discountValue * 100, cap);
  })();
  const payable = Math.max(0, itemsSubtotal - itemsDiscount - billDisc - couponDisc);
  const redeemPaise = Math.min(
    redeemPoints * (1),
    payable
  );
  const grandTotal = Math.max(0, payable - redeemPaise);

  const totalQty = cart.reduce((s, l) => s + l.qty, 0);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await saleApi.validateCoupon({
        code: coupon,
        subtotal: (itemsSubtotal - itemsDiscount) / 100,
      });
      setCouponApplied({ ...res.data.data.coupon, ...res.data.data });
      toast.success('Coupon applied');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid coupon');
    }
  };

  const payNow = () => {
    if (!cart.length) return toast.error('Cart is empty');
    setPaymentModal(true);
  };

  const handleHold = async (notes) => {
    const payload = {
      items: cart.map((l) => ({
        variant: l.variantId,
        quantity: l.qty,
        unitPrice: l.unitPrice / 100,
      })),
      customer: customer?._id || null,
      notes,
      status: 'HELD',
    };
    await holdMutation.mutateAsync(payload);
    setCart(EMPTY_CART);
    setCustomer(null);
  };

  const handleCompleteSale = (payments, notes) => {
    const payload = {
      customer: customer?._id || null,
      items: cart.map((l) => ({
        variant: l.variantId,
        quantity: l.qty,
        unitPrice: l.unitPrice / 100,
        discount: l.itemDiscount / 100,
      })),
      billDiscountType: billDiscount.type,
      billDiscountValue: billDiscount.value,
      couponCode: couponApplied?.coupon?.code || couponApplied?.code || (coupon || null),
      payments,
      redeemPoints,
      notes,
      status: 'COMPLETED',
    };
    completeMutation.mutate(payload);
  };

  const continueSale = (sale) => {
    setCart(
      sale.items.map((i) => ({
        variantId: i.variant,
        productId: i.product,
        name: i.name,
        sku: i.sku,
        size: i.size || '',
        color: i.color || '',
        unitPrice: i.unitPrice,
        qty: i.quantity,
        itemDiscount: i.discount,
        stock: 9999,
      }))
    );
    setCustomer(sale.customer || null);
    setHoldModal(false);
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] flex-col gap-4 lg:flex-row">
      {/* Left: products */}
      <div className="flex min-w-0 flex-1 flex-col rounded-xl border border-sky-200 bg-sky-50 shadow-sm">
        <div className="border-b border-slate-200 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onBarcodeAdd(search)}
                placeholder="Scan barcode, search by name or SKU... (F2)"
                className="input-base pl-9"
                autoFocus
              />
            </div>
            <Select className="w-40" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {(cats?.items || []).map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{productData?.total || 0} products · {cart.length} in cart</span>
            <span className="hidden md:block">F2 Search · F4 Customer · F6 Hold · F8 Payment · Ctrl+Enter Pay</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
          {isLoading ? (
            <Spinner fullPage={false} />
          ) : (productData?.items || []).length === 0 ? (
            <p className="py-16 text-center text-sm text-slate-400">No products found. Try a different search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {productData.items.map((p) => {
                const available = p.variants.filter((v) => v.stock > 0 && v.status === 'ACTIVE');
                const hasVariants = p.variants.length > 1;
                return (
                  <div key={p._id} className="rounded-lg border border-slate-200 p-3 transition-shadow hover:border-blue-300 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{(p.category && p.category.name) || ''} · {p.sku || 'no SKU'}</div>
                      </div>
                      {p.images?.[0] && (
                        <img src={p.images[0].startsWith('http') ? p.images[0] : `/uploads/${p.images[0].replace('/uploads/', '')}`} alt="" className="h-10 w-10 rounded object-cover" />
                      )}
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-800">{formatRupees(p.sellingPrice)}</div>

                    {hasVariants ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {available.slice(0, 5).map((v) => (
                          <button
                            key={v._id}
                            onClick={() => addToCart(p, v)}
                            disabled={v.stock <= 0}
                            className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-600 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-40"
                            title={`Size: ${v.size?.name || '-'} Color: ${v.color?.name || '-'} Stock: ${v.stock}`}
                          >
                            {v.size?.name || '-'}/{v.color?.name || '-'}
                          </button>
                        ))}
                        {available.length > 5 && <span className="text-[10px] text-slate-400">+{available.length - 5} more</span>}
                      </div>
                    ) : (
                      available[0] && (
                        <Button
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => addToCart(p, available[0])}
                          loading={adding === available[0]._id}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add
                        </Button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: cart */}
      <div className="flex w-full flex-col rounded-xl border border-sky-200 bg-sky-50 shadow-sm lg:w-[380px] xl:w-[420px]">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">Current Bill</span>
            {totalQty > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{totalQty}</span>}
          </div>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-red-500 hover:underline">Clear</button>
          )}
        </div>

        <button
          onClick={() => setCustomerModal(true)}
          className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm hover:border-blue-400 hover:bg-blue-50"
        >
          <span className="flex items-center gap-2 text-slate-600">
            <User className="h-4 w-4" />
            {customer ? customer.name : 'Select or create customer'}
          </span>
          {customer && (
            <span className="text-xs text-slate-400">
              {customer.phone || ''} <button className="ml-1 text-red-400" onClick={(e) => { e.stopPropagation(); setCustomer(null); }}>✕</button>
            </span>
          )}
        </button>

        <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin p-3">
          {cart.length === 0 ? (
            <p className="py-14 text-center text-sm text-slate-400">Scan or search a product to add it here</p>
          ) : (
            cart.map((l) => (
              <div key={l.variantId} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{l.name}</div>
                    <div className="text-xs text-slate-400">
                      {[l.size, l.color].filter(Boolean).join(' · ') || 'Default'} · {l.sku || '-'}
                    </div>
                  </div>
                  <button onClick={() => removeItem(l.variantId)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(l.variantId, -1)} className="rounded border border-slate-200 bg-white p-1 hover:bg-slate-100"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                    <button onClick={() => changeQty(l.variantId, 1)} className="rounded border border-slate-200 bg-white p-1 hover:bg-slate-100"><Plus className="h-3 w-3" /></button>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Percent className="h-3 w-3" />
                      <input
                        type="number"
                        value={l.itemDiscount / 100 || ''}
                        min="0"
                        placeholder="disc"
                        className="w-14 rounded border border-slate-200 px-1 py-0.5 text-xs"
                        onChange={(e) =>
                          setCart(cart.map((x) => (x.variantId === l.variantId ? { ...x, itemDiscount: Math.max(0, Number(e.target.value || 0)) * 100 } : x)))
                        }
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-800">
                      {formatRupees(l.unitPrice * l.qty - Math.min(l.itemDiscount, l.unitPrice * l.qty))}
                    </div>
                    {l.itemDiscount > 0 && (
                      <div className="text-[10px] text-slate-400 line-through">{formatRupees(l.unitPrice * l.qty)}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Items Total</span>
            <span>{formatRupees(itemsSubtotal)}</span>
          </div>
          {itemsDiscount > 0 && (
            <div className="flex items-center justify-between text-sm text-red-500">
              <span>Item Discounts</span>
              <span>-{formatRupees(itemsDiscount)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Percent className="h-3 w-3" />
            <input
              type="number"
              className="w-16 rounded border border-slate-200 px-1 py-0.5"
              placeholder="0"
              value={billDiscount.value || ''}
              onChange={(e) => setBillDiscount({ ...billDiscount, value: Number(e.target.value || 0) })}
            />
            <Select
              className="h-7 w-28 py-0 text-xs"
              value={billDiscount.type}
              onChange={(e) => setBillDiscount({ ...billDiscount, type: e.target.value })}
            >
              <option value="FIXED">₹ Fixed</option>
              <option value="PERCENT">% Percent</option>
            </Select>
            <span className="ml-auto text-sm font-medium text-red-500">{billDisc > 0 ? `-${formatRupees(billDisc)}` : ''}</span>
          </div>
          {!couponApplied ? (
            <div className="flex gap-1">
              <input
                className="input-base flex-1"
                placeholder="Enter coupon code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <Button variant="secondary" size="sm" onClick={applyCoupon}>Apply</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700">
              <span>Coupon {couponApplied.code || couponApplied.coupon?.code} applied: -{formatRupees(couponDisc)}</span>
              <button onClick={() => { setCouponApplied(null); setCoupon(''); }}>✕</button>
            </div>
          )}
          {customer && redeemPoints === 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Loyalty points: {customer.loyaltyPoints}</span>
              {customer.loyaltyPoints > 0 && (
                <button className="text-blue-600 hover:underline" onClick={() => setRedeemPoints(customer.loyaltyPoints)}>Use points</button>
              )}
            </div>
          )}
          {redeemPoints > 0 && (
            <div className="flex items-center justify-between rounded bg-violet-50 px-2 py-1.5 text-xs text-violet-700">
              <span>Redeeming {redeemPoints} pts (-{formatRupees(redeemPaise)})</span>
              <button onClick={() => setRedeemPoints(0)}>✕</button>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-sm font-semibold text-slate-800">Total to Pay</span>
            <span className="text-2xl font-bold text-slate-900">{formatRupees(grandTotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setHoldModal(true)} disabled={!cart.length}>
              <PauseCircle className="h-4 w-4" /> Hold (F6)
            </Button>
            <Button onClick={payNow} disabled={!cart.length} className="!bg-emerald-600 hover:!bg-emerald-700">
              <CreditCard className="h-4 w-4" /> Payment (F8)
            </Button>
          </div>
        </div>
      </div>

      <CustomerPicker open={customerModal} onClose={() => setCustomerModal(false)} onSelect={(c) => { setCustomer(c); setCustomerModal(false); }} />

      <HoldBills open={holdModal} onClose={() => setHoldModal(false)} bills={heldBills?.items || []} onResume={continueSale} onHold={handleHold} />

      <PaymentModal
        open={paymentModal && cart.length > 0}
        onClose={() => setPaymentModal(false)}
        total={grandTotal}
        onComplete={handleCompleteSale}
        customer={customer}
        canCredit={customer != null}
        loading={completeMutation.isLoading}
        exchange={payable - redeemPaise}
      />

      <CompleteSaleModal sale={completedSale} onClose={() => setCompletedSale(null)} />
    </div>
  );
}

function CustomerPicker({ open, onClose, onSelect }) {
  const [q, setQ] = useState('');
  const [form, setForm] = useState({ name: '', phone: '' });
  const debounced = useDebounce(q, 300);
  const { data, isLoading } = useQuery({
    queryKey: ['customer-search', debounced],
    queryFn: () => customerApi.search(debounced).then((r) => r.data.data),
    enabled: open,
  });

  const quickCreate = async () => {
    if (!form.name && !form.phone) return toast.error('Enter a name or phone');
    try {
      const res = await customerApi.quick(form);
      onSelect(res.data.data);
      toast.success('Customer saved');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not save customer');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Select Customer (F4)" size="md">
      <div className="space-y-4">
        <Input placeholder="Search by name or phone..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="space-y-1">
          {isLoading && <p className="py-4 text-center text-sm text-slate-400">Searching...</p>}
          {data?.length === 0 && !isLoading && <p className="py-4 text-center text-sm text-slate-400">No matching customers</p>}
          {data?.map((c) => (
            <button
              key={c._id}
              onClick={() => onSelect(c)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-blue-50"
            >
              <div>
                <div className="text-sm font-medium text-slate-700">{c.name}</div>
                <div className="text-xs text-slate-400">{c.phone || c.email || 'No contact'}</div>
              </div>
              <span className="text-xs text-slate-400">{c.loyaltyPoints} pts</span>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-slate-500">Quick create customer</p>
          <div className="flex gap-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Button onClick={quickCreate}>Add</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function HoldBills({ open, onClose, bills, onResume, onHold }) {
  const [notes, setNotes] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Held Bills (F6)" size="md">
      <div className="space-y-3">
        <div className="space-y-1">
          {bills.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No held bills</p>}
          {bills.map((b) => (
            <button
              key={b._id}
              onClick={() => onResume(b)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-blue-50"
            >
              <div>
                <div className="text-sm font-medium text-slate-700">{b.invoiceNumber}</div>
                <div className="text-xs text-slate-400">{b.items?.reduce((s, i) => s + i.quantity, 0)} items · {b.customer?.name || 'Walk-in'}</div>
              </div>
              <span className="text-sm font-semibold text-slate-700">{formatRupees(b.grandTotal)}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-100 pt-3">
          <Input placeholder="Hold notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="mt-2 w-full" variant="secondary" onClick={() => { onHold(notes); setNotes(''); onClose(); }}>
            Hold current bill
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentModal({ open, onClose, total, onComplete, canCredit, loading }) {
  const [rows, setRows] = useState([{ method: 'Cash', amount: '', reference: '' }]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) setRows([{ method: 'Cash', amount: (total / 100).toFixed(2), reference: '' }]);
  }, [open, total]);

  const addRow = () => setRows([...rows, { method: 'UPI', amount: '', reference: '' }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const setRow = (i, patch) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const sum = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const hasCredit = rows.some((r) => r.method === 'Credit');
  const diff = (sum * 100 - total) / 100;
  const canSubmit = rows.some((r) => Number(r.amount) > 0) && (hasCredit ? canCredit : true) && !loading;

  const fillRemaining = () => {
    const nonCreditSum = rows.filter((r) => r.method !== 'Credit').reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const remaining = Math.max(0, (total / 100) - nonCreditSum);
    const idx = rows.findIndex((r) => r.method === 'Credit');
    if (idx >= 0) setRow(idx, { amount: remaining.toFixed(2) });
    else setRows([...rows, { method: 'Credit', amount: remaining.toFixed(2), reference: '' }]);
  };

  const submit = () => {
    const payments = rows
      .filter((r) => Number(r.amount) > 0)
      .map((r) => ({ method: r.method, amount: Number(r.amount), reference: r.reference }));
    if (!hasCredit && diff < -0.01) {
      return toast.error('Payment exceeds total amount');
    }
    onComplete(payments, notes);
  };

  return (
    <Modal open={open} onClose={onClose} title="Payment (F8)" size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading} disabled={!canSubmit} className="!bg-emerald-600 hover:!bg-emerald-700">
            Complete Sale
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-between rounded-lg bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-500">Amount to collect</span>
          <span className="text-lg font-bold text-slate-900">{formatRupees(total)}</span>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select className="w-36" value={r.method} onChange={(e) => setRow(i, { method: e.target.value })}>
                {['Cash', 'UPI', 'Card', 'Bank Transfer', ...(canCredit ? ['Credit'] : [])].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
              <input
                className="input-base w-32"
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={r.amount}
                onChange={(e) => setRow(i, { amount: e.target.value })}
              />
              <input
                className="input-base flex-1"
                placeholder="Reference (txn id)"
                value={r.reference}
                onChange={(e) => setRow(i, { reference: e.target.value })}
              />
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={addRow}>+ Add method</Button>
          {hasCredit ? (
            <span className="text-xs text-amber-600">Credit sale selected</span>
          ) : diff > 0.01 ? (
            <button onClick={fillRemaining} className="text-xs text-blue-600 hover:underline">
              Balance due as credit: {formatRupees(diff * 100)}
            </button>
          ) : diff < -0.01 ? (
            <span className="text-xs text-red-500">Overpayment of {formatRupees(-diff * 100)}</span>
          ) : (
            <span className="text-xs text-emerald-600">Fully covered</span>
          )}
        </div>
        {hasCredit && !canCredit && <p className="text-xs text-red-500">Credit requires a selected customer.</p>}
        <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

function CompleteSaleModal({ sale, onClose }) {
  return (
    <Modal open={!!sale} onClose={onClose} title="Sale Completed" size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" /> Close
          </Button>
          <Button onClick={() => { onClose(); setTimeout(() => window.print(), 300); }}>
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
        </>
      }
    >
      {sale && (
        <div>
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-emerald-50 p-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <div>
              <div className="text-sm font-semibold text-emerald-800">Bill {sale.invoiceNumber} completed</div>
              <div className="text-xs text-emerald-700">Total: {formatRupees(sale.grandTotal)} · Status: {sale.paymentStatus}</div>
            </div>
          </div>
          <div id="print-area">
            <InvoiceReceipt sale={sale} />
          </div>
        </div>
      )}
    </Modal>
  );
}