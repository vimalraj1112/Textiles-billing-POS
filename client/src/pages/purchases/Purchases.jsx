import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Truck } from 'lucide-react';
import { purchaseApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Select from '../../components/Select';
import Input from '../../components/Input';
import EmptyState from '../../components/EmptyState';
import { PaymentBadge } from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import { formatRupees, formatDate, todayISO } from '../../utils/format';
import useDebounce from '../../hooks/useDebounce';

export default function Purchases() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debounced = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', page, debounced, paymentStatus, from, to],
    queryFn: () =>
      purchaseApi
        .list({ page, limit: 15, search: debounced, paymentStatus: paymentStatus || undefined, from: from || undefined, to: to || undefined })
        .then((r) => r.data.data),
  });

  const columns = [
    {
      key: 'purchaseNumber',
      label: 'Number',
      render: (p) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Truck className="h-4 w-4" /></div>
          <span className="font-medium text-blue-600">{p.purchaseNumber}</span>
        </div>
      ),
    },
    { key: 'supplier', label: 'Supplier', render: (p) => p.supplier?.name || '-' },
    { key: 'purchaseDate', label: 'Date', render: (p) => formatDate(p.purchaseDate) },
    { key: 'items', label: 'Items', render: (p) => p.items?.length || 0 },
    { key: 'total', label: 'Total', render: (p) => <span className="font-medium">{formatRupees(p.total)}</span> },
    { key: 'paid', label: 'Paid', render: (p) => <span className="text-emerald-600">{formatRupees(p.paidAmount)}</span> },
    { key: 'due', label: 'Due', render: (p) => <span className={p.dueAmount > 0 ? 'text-red-600' : ''}>{formatRupees(p.dueAmount)}</span> },
    { key: 'status', label: 'Status', render: (p) => <PaymentBadge status={p.paymentStatus} /> },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <Link to={`/purchases/${p._id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600" onClick={(e) => e.stopPropagation()}><Eye className="h-4 w-4" /></Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Purchases" subtitle="Stock-in from suppliers"
        actions={<Link to="/purchases/new" className="btn-primary"><Plus className="h-4 w-4" /> New Purchase</Link>} />
      <div className="card">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <SearchBox className="w-64" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search purchase number..." />
          <Select className="w-40" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PENDING">Pending</option>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" className="w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-slate-400">to</span>
            <Input type="date" className="w-40" value={to} max={todayISO()} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No purchases found" description="Record your first purchase to bring stock in." action={<Link to="/purchases/new" className="btn-primary"><Plus className="h-4 w-4" /> New Purchase</Link>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} onRowClick={(p) => navigate(`/purchases/${p._id}`)} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}