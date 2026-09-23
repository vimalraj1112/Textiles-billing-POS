import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Boxes, CreditCard, PiggyBank, Receipt } from 'lucide-react';
import { reportApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import ErrorState from '../../components/ErrorState';
import { formatRupees, formatNumber, todayISO } from '../../utils/format';
import { REPORT_RANGES, rangeDates } from '../../constants';

function RangePicker({ range, onRange, from, to, setFrom, setTo }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg bg-slate-100 p-1">
        {Object.entries(REPORT_RANGES).map(([key, value]) => (
          <button key={key} onClick={() => onRange(value)} className={'rounded-md px-3 py-1.5 text-xs font-medium ' + (range === value ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500')}>
            {value.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
      {range === 'custom' && (
        <div className="flex items-center gap-2">
          <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-xs text-slate-400">to</span>
          <Input type="date" className="w-40" value={to} max={todayISO()} onChange={(e) => setTo(e.target.value)} />
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={'mt-1 text-xl font-bold ' + (accent || 'text-slate-800')}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function SalesTab() {
  const [range, setRange] = useState('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dates = range === 'custom' ? { from: from || undefined, to: to || undefined } : rangeDates(range);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'sales', range, from, to],
    queryFn: () => reportApi.sales({ from: dates.from, to: dates.to }).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={6} />;
  if (isError) return <ErrorState message="Could not load report" onRetry={refetch} />;

  return (
    <div>
      <div className="mb-4 flex justify-end"><RangePicker range={range} onRange={setRange} from={from} to={to} setFrom={setFrom} setTo={setTo} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Invoices" value={formatNumber(data.invoices)} />
        <KpiCard label="Gross Sales" value={formatRupees(data.grossSales)} />
        <KpiCard label="Discounts Given" value={`-${formatRupees(data.discounts)}`} accent="text-red-600" />
        <KpiCard label="Net Sales" value={formatRupees(data.netSales)} accent="text-emerald-600" />
        <KpiCard label="Net After Returns" value={formatRupees(data.netSalesAfterReturns)} />
        <KpiCard label="Returns" value={`${formatRupees(data.returnsAmount)} (${data.returnsCount})`} accent={data.returnsCount ? 'text-red-600' : ''} />
        <KpiCard label="Tax Collected" value={formatRupees(data.tax)} />
        <KpiCard label="Avg Invoice Value" value={formatRupees(data.averageInvoiceValue)} />
        <KpiCard label="Qty Sold" value={formatNumber(data.qtySold)} />
        <KpiCard label="COGS" value={formatRupees(data.cogs)} />
        <KpiCard label="Gross Profit" value={formatRupees(data.profit)} accent="text-emerald-600" />
      </div>
    </div>
  );
}

function ProductsTab() {
  const [range, setRange] = useState('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dates = range === 'custom' ? { from: from || undefined, to: to || undefined } : rangeDates(range);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'products', range, from, to],
    queryFn: () => reportApi.products({ from: dates.from, to: dates.to, limit: 10 }).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={6} />;
  if (isError) return <ErrorState message="Could not load report" onRetry={refetch} />;

  const ProductTable = ({ title, rows }) => (
    <div className="card">
      <div className="border-b border-slate-100 px-5 py-4"><h3 className="text-sm font-semibold text-slate-700">{title}</h3></div>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-400">No sales in this period.</p>
      ) : (
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-5 py-3">#</th><th className="px-5 py-3">Product</th><th className="px-5 py-3">Qty</th>
              <th className="px-5 py-3 text-right">Revenue</th><th className="px-5 py-3 text-right">Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={r._id} className={i % 2 ? 'bg-slate-50/50' : ''}>
                <td className="px-5 py-3 text-sm text-slate-400">{i + 1}</td>
                <td className="px-5 py-3 text-sm font-medium">{r.productName}</td>
                <td className="px-5 py-3 text-sm">{r.quantity}</td>
                <td className="px-5 py-3 text-right text-sm font-medium">{formatRupees(r.revenue)}</td>
                <td className="px-5 py-3 text-right text-sm text-emerald-600">{formatRupees(r.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex justify-end"><RangePicker range={range} onRange={setRange} from={from} to={to} setFrom={setFrom} setTo={setTo} /></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <ProductTable title="Top Selling Products" rows={data.best || []} />
        <ProductTable title="Least Selling Products" rows={data.worst || []} />
      </div>
    </div>
  );
}

function PaymentsTab() {
  const [range, setRange] = useState('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dates = range === 'custom' ? { from: from || undefined, to: to || undefined } : rangeDates(range);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'payments', range, from, to],
    queryFn: () => reportApi.payments({ from: dates.from, to: dates.to }).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={5} />;
  if (isError) return <ErrorState message="Could not load report" onRetry={refetch} />;

  const total = data.totals || 0;
  return (
    <div>
      <div className="mb-4 flex justify-end"><RangePicker range={range} onRange={setRange} from={from} to={to} setFrom={setFrom} setTo={setTo} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data.rows || []).map((r) => (
          <div key={r._id} className="card p-4">
            <div className="flex items-center justify-between">
              <Badge color="blue">{r._id}</Badge>
              <span className="text-xs text-slate-400">{r.count} txns</span>
            </div>
            <div className="mt-2 text-xl font-bold">{formatRupees(r.total)}</div>
            <div className="text-xs text-slate-400">{total ? Math.round((r.total / total) * 100) : 0}% of collections</div>
          </div>
        ))}
        {(data.rows || []).length === 0 && <p className="col-span-full py-8 text-center text-sm text-slate-400">No payments in this period.</p>}
      </div>
      <div className="card mt-4 flex items-center justify-between p-4">
        <span className="text-sm text-slate-500">Total Collected</span>
        <span className="text-lg font-bold text-emerald-600">{formatRupees(total)}</span>
      </div>
    </div>
  );
}

function ProfitTab() {
  const [range, setRange] = useState('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const dates = range === 'custom' ? { from: from || undefined, to: to || undefined } : rangeDates(range);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'profit', range, from, to],
    queryFn: () => reportApi.profit({ from: dates.from, to: dates.to }).then((r) => r.data.data),
  });

  if (isLoading) return <Skeleton rows={5} />;
  if (isError) return <ErrorState message="Could not load report" onRetry={refetch} />;

  return (
    <div>
      <div className="mb-4 flex justify-end"><RangePicker range={range} onRange={setRange} from={from} to={to} setFrom={setFrom} setTo={setTo} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Net Sales" value={formatRupees(data.netSales)} />
        <KpiCard label="COGS" value={formatRupees(data.cogs)} accent="text-slate-500" />
        <KpiCard label="Gross Profit" value={formatRupees(data.grossProfit)} accent="text-emerald-600" />
        <KpiCard label="Expenses" value={formatRupees(data.totalExpenses)} accent={data.totalExpenses ? 'text-red-600' : ''} />
        <KpiCard label="Net Profit" value={formatRupees(data.netProfit)} accent={data.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} />
        <KpiCard label="Purchases" value={formatRupees(data.totalPurchases)} />
        <KpiCard label="Margin" value={`${data.netSales ? Math.round((data.grossProfit / data.netSales) * 100) : 0}%`} />
      </div>
    </div>
  );
}

export default function Reports({ tab: initialTab = 'sales' }) {
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    { key: 'sales', label: 'Sales', icon: Receipt },
    { key: 'products', label: 'Products', icon: Boxes },
    { key: 'payments', label: 'Payments', icon: CreditCard },
    { key: 'profit', label: 'Profit', icon: PiggyBank },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales, products, payments and profit analysis" />
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={'flex items-center gap-2 flex-1 justify-center rounded-md px-3 py-2 text-sm font-medium ' + (tab === t.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500')}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>
      {tab === 'sales' && <SalesTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'payments' && <PaymentsTab />}
      {tab === 'profit' && <ProfitTab />}
    </div>
  );
}