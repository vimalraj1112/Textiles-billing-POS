import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ReceiptText,
  TrendingUp,
  Package,
  AlertTriangle,
  Hourglass,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardApi } from '../api';
import { formatRupees, formatNumber, formatDateTime } from '../utils/format';
import { Skeleton } from '../components/Loading';
import ErrorState from '../components/ErrorState';
import { PaymentBadge, StockBadge } from '../components/Badge';

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9'];

function KpiCard({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={'flex h-10 w-10 items-center justify-center rounded-lg ' + tint}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 7],
    queryFn: () => dashboardApi.get({ days: 7 }).then((r) => r.data.data),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton rows={10} /></div>;
  if (isError) return <ErrorState message="Could not load dashboard data." onRetry={refetch} />;

  const k = data.kpis;
  const pieData = (data.paymentSummary || []).map((p) => ({ name: p.method, value: p.total / 100 }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={IndianRupee} label="Today's Sales" value={formatRupees(k.todaySales)} tint="bg-emerald-50 text-emerald-600" />
        <KpiCard icon={ReceiptText} label="Today's Orders" value={formatNumber(k.todayOrders)} tint="bg-blue-50 text-blue-600" />
        <KpiCard icon={TrendingUp} label="Today's Profit" value={formatRupees(k.todayProfit)} tint="bg-violet-50 text-violet-600" />
        <KpiCard icon={Package} label="Total Products" value={formatNumber(k.totalProducts)} tint="bg-slate-100 text-slate-600" />
        <KpiCard icon={AlertTriangle} label="Low Stock" value={formatNumber(k.lowStockProducts)} tint="bg-amber-50 text-amber-600" />
        <KpiCard icon={Hourglass} label="Pending Payments" value={formatRupees(k.pendingPayments)} sub={`${k.pendingCustomers} customer(s)`} tint="bg-red-50 text-red-600" />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Last 7 Days Sales</h2>
            <span className="text-xs text-slate-400">Revenue in ₹</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.chart.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatRupees(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Payments Today</h2>
          {pieData.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">No payments recorded today</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatRupees(v * 100)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Sales This Year</h2>
            <Link to="/reports" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              View reports <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yearlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatRupees(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Top Selling Products</h2>
          <div className="space-y-3">
            {(data.topProducts || []).slice(0, 5).map((p, i) => (
              <div key={p._id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-500">{i + 1}</span>
                  <span className="text-sm text-slate-700">{p.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{formatNumber(p.sold)}</div>
                  <div className="text-xs text-slate-400">{formatRupees(p.revenue)}</div>
                </div>
              </div>
            ))}
            {data.topProducts?.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No sales yet</p>}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Recent Transactions</h2>
          </div>
          <div>
            {data.recentTransactions.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-400">No sales recorded</p>}
            {data.recentTransactions.slice(0, 6).map((s) => (
              <Link key={s._id} to={`/sales/${s._id}`} className="flex items-center justify-between border-b border-slate-50 px-4 py-2.5 hover:bg-slate-50">
                <div>
                  <div className="text-sm font-medium text-slate-700">{s.invoiceNumber}</div>
                  <div className="text-xs text-slate-400">{s.customer?.name || 'Walk-in'} · {formatDateTime(s.saleDate)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-700">{formatRupees(s.grandTotal)}</div>
                  <PaymentBadge status={s.paymentStatus} />
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-700">Low Stock Alerts</h2>
          </div>
          <div>
            {data.lowStock.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-400">All inventory healthy</p>}
            {data.lowStock.slice(0, 6).map((v) => (
              <div key={v._id} className="flex items-center justify-between border-b border-slate-50 px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-700">{v.product?.name}</div>
                  <div className="text-xs text-slate-400">{v.size?.name || '-'} / {v.color?.name || '-'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{v.stock} left</span>
                  <StockBadge status={v.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}