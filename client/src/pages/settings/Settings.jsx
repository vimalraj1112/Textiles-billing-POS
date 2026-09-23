import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Save, Store, Percent, Gift, Printer } from 'lucide-react';
import { settingsApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import { Skeleton } from '../../components/Loading';

const emptyForm = () => ({
  shopName: '',
  address: '',
  phone: '',
  email: '',
  gstin: '',
  invoicePrefix: 'INV',
  currency: 'INR',
  logo: '',
  defaultPaymentMethod: 'Cash',
  receiptSize: '80mm',
  autoPrint: true,
  allowNegativeStock: false,
  returnPolicy: '',
  invoiceFooter: '',
  loyaltyPointsPerRupee: 100,
  loyaltyRupeePerPoint: 1,
  loyaltyMinRedemption: 100,
  taxRate: 0,
});

export default function Settings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
  });

  useEffect(() => {
    if (data && form === null) setForm({ ...emptyForm(), ...data });
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      toast.success('Settings saved');
      qc.invalidateQueries(['settings']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save settings'),
  });

  if (isLoading || !form) return <Skeleton rows={8} />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.shopName.trim()) return toast.error('Shop name is required');
    saveMutation.mutate({
      shopName: form.shopName,
      address: form.address || null,
      phone: form.phone || null,
      email: form.email || null,
      gstin: form.gstin || null,
      invoicePrefix: form.invoicePrefix || 'INV',
      currency: form.currency,
      logo: form.logo || null,
      defaultPaymentMethod: form.defaultPaymentMethod,
      receiptSize: form.receiptSize,
      autoPrint: !!form.autoPrint,
      allowNegativeStock: !!form.allowNegativeStock,
      returnPolicy: form.returnPolicy || null,
      invoiceFooter: form.invoiceFooter || null,
      loyaltyPointsPerRupee: Number(form.loyaltyPointsPerRupee) || 0,
      loyaltyRupeePerPoint: Number(form.loyaltyRupeePerPoint) || 0,
      loyaltyMinRedemption: Number(form.loyaltyMinRedemption) || 0,
      taxRate: Number(form.taxRate) || 0,
    });
  };

  return (
    <div>
      <PageHeader title="Shop Settings" subtitle="Business details, receipts, loyalty and stock rules" />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-5">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2"><Store className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-700">Business Details</h3></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input label="Shop Name *" value={form.shopName} onChange={(e) => set('shopName', e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <Input label="GSTIN" value={form.gstin} onChange={(e) => set('gstin', e.target.value)} />
            <Input label="Invoice Prefix" value={form.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} />
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2"><Printer className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-700">Receipt &amp; Billing</h3></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Select label="Receipt Size" value={form.receiptSize} onChange={(e) => set('receiptSize', e.target.value)}>
              <option value="58mm">58mm thermal</option>
              <option value="80mm">80mm thermal</option>
              <option value="A4">A4</option>
            </Select>
            <Select label="Default Payment Method" value={form.defaultPaymentMethod} onChange={(e) => set('defaultPaymentMethod', e.target.value)}>
              <option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
            </Select>
            <Select label="Currency" value={form.currency} onChange={(e) => set('currency', e.target.value)}>
              <option value="INR">INR (₹)</option>
            </Select>
            <label className="flex items-center gap-2 pt-5 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={form.autoPrint} onChange={(e) => set('autoPrint', e.target.checked)} />
              Auto-print receipt after sale
            </label>
            <label className="flex items-center gap-2 pt-5 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={form.allowNegativeStock} onChange={(e) => set('allowNegativeStock', e.target.checked)} />
              Allow negative stock on sale
            </label>
            <Input label="Default Tax Rate (%)" type="number" min="0" max="100" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} />
            <div className="md:col-span-2">
              <Input label="Return Policy" value={form.returnPolicy} onChange={(e) => set('returnPolicy', e.target.value)} />
            </div>
            <Input label="Invoice Footer" value={form.invoiceFooter} onChange={(e) => set('invoiceFooter', e.target.value)} />
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2"><Gift className="h-4 w-4 text-slate-400" /><h3 className="text-sm font-semibold text-slate-700">Loyalty Program</h3></div>
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Points earned per ₹X spent" type="number" min="1" value={form.loyaltyPointsPerRupee} onChange={(e) => set('loyaltyPointsPerRupee', e.target.value)} />
            <Input label="Value of 1 point (₹)" type="number" min="0" step="0.01" value={form.loyaltyRupeePerPoint} onChange={(e) => set('loyaltyRupeePerPoint', e.target.value)} />
            <Input label="Minimum points to redeem" type="number" min="0" value={form.loyaltyMinRedemption} onChange={(e) => set('loyaltyMinRedemption', e.target.value)} />
          </div>
          <p className="mt-3 flex items-center gap-1 text-xs text-slate-400"><Percent className="h-3 w-3" />Customers earn {form.loyaltyPointsPerRupee ? `1 point per ₹${form.loyaltyPointsPerRupee}` : 'no'} spent and each point is worth ₹{form.loyaltyRupeePerPoint} at checkout.</p>
        </div>

        <div className="flex justify-end pb-8">
          <Button type="submit" loading={saveMutation.isLoading}><Save className="h-4 w-4" /> Save Settings</Button>
        </div>
      </form>
    </div>
  );
}