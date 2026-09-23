import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../api';
import { formatRupees, formatDateTime } from '../../utils/format';

export default function InvoiceReceipt({ sale }) {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get().then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const s = data || {};

  return (
    <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-5 text-sm">
      <div className="border-b border-dashed border-slate-300 pb-3 text-center">
        <div className="text-lg font-bold text-slate-800">{s.shopName || 'Mathi Collections'}</div>
        <div className="text-xs text-slate-500">{s.address}</div>
        <div className="text-xs text-slate-500">{s.phone}</div>
        {s.gstin && <div className="text-xs text-slate-500">GSTIN: {s.gstin}</div>}
      </div>

      <div className="space-y-1 border-b border-dashed border-slate-300 py-3 text-xs">
        <div className="flex justify-between"><span className="text-slate-500">Invoice</span><span className="font-semibold">{sale.invoiceNumber || sale._id}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Date</span><span>{formatDateTime(sale.saleDate)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Cashier</span><span>{sale.cashier?.name || '-'}</span></div>
        {sale.customer && (
          <div className="flex justify-between">
            <span className="text-slate-500">Customer</span>
            <span>{sale.customer.name}{sale.customer.phone ? ` · ${sale.customer.phone}` : ''}</span>
          </div>
        )}
      </div>

      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="py-1.5">Item</th>
            <th className="py-1.5 text-center">Qty</th>
            <th className="py-1.5 text-center">Rate</th>
            <th className="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1.5">
                <div className="font-medium text-slate-700">{item.name}</div>
                <div className="text-[10px] text-slate-400">
                  {[item.sku, item.size, item.color].filter(Boolean).join(' · ')}
                </div>
              </td>
              <td className="py-1.5 text-center">{item.quantity}</td>
              <td className="py-1.5 text-center">{formatRupees(item.unitPrice)}</td>
              <td className="py-1.5 text-right font-medium">{formatRupees(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs">
        <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatRupees(sale.subtotal)}</span></div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-red-500"><span>Discount</span><span>-{formatRupees(sale.discount)}</span></div>
        )}
        {sale.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{formatRupees(sale.tax)}</span></div>}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
          <span>Total</span><span>{formatRupees(sale.grandTotal)}</span>
        </div>
        <div className="flex justify-between"><span className="text-slate-500">Payment</span><span>{sale.paymentStatus}</span></div>
        {sale.amountDue > 0 && (
          <div className="flex justify-between text-amber-600"><span>Balance Due</span><span>{formatRupees(sale.amountDue)}</span></div>
        )}
      </div>

      <div className="mt-4 border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500">
        <p>{s.returnPolicy}</p>
        <p className="mt-1 font-medium text-slate-600">{s.invoiceFooter || 'Thank you for shopping!'}</p>
      </div>
    </div>
  );
}