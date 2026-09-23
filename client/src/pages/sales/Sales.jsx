import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Eye, Receipt } from 'lucide-react';
import { saleApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Select from '../../components/Select';
import Input from '../../components/Input';
import Badge, { PaymentBadge } from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { formatRupees, formatDateTime, todayISO } from '../../utils/format';
import useDebounce from '../../hooks/useDebounce';

export default function Sales() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debounced = useDebounce(search, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page, debounced, status, paymentMethod, from, to],
    queryFn: () =>
      saleApi
        .list({ page, limit: 15, search: debounced, status: status || undefined, paymentMethod: paymentMethod || undefined, from: from || undefined, to: to || undefined })
        .then((r) => r.data.data),
  });

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Receipt className="h-4 w-4" /></div>
          <span className="font-medium text-blue-600">{s.invoiceNumber}</span>
        </div>
      ),
    },
    { key: 'saleDate', label: 'Date/Time', render: (s) => formatDateTime(s.saleDate) },
    { key: 'customer', label: 'Customer', render: (s) => s.customer?.name || 'Walk-in' },
    { key: 'items', label: 'Items', render: (s) => s.items?.length || 0 },
    { key: 'grandTotal', label: 'Total', render: (s) => <span className="font-medium">{formatRupees(s.grandTotal)}</span> },
    { key: 'amountPaid', label: 'Paid', render: (s) => <span className="text-emerald-600">{formatRupees(s.amountPaid)}</span> },
    {
      key: 'status',
      label: 'Payment',
      render: (s) => (<div className="flex flex-col gap-1"><PaymentBadge status={s.paymentStatus} /></div>),
    },
    {
      key: 'saleStatus',
      label: 'Bill',
      render: (s) => <Badge color={s.status === 'COMPLETED' ? 'green' : s.status === 'HELD' ? 'amber' : 'red'}>{s.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (s) => (
        <Link to={`/sales/${s._id}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600" onClick={(e) => e.stopPropagation()}><Eye className="h-4 w-4" /></Link>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Sales Invoices" subtitle="View all billing and payment status"
        actions={<Link to="/pos" className="btn-primary"><Plus className="h-4 w-4" /> New Sale (POS)</Link>} />
      <div className="card">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <SearchBox className="w-56" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoice number..." />
          <Select className="w-32" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Bills</option>
            <option value="COMPLETED">Completed</option>
            <option value="HELD">Held</option>
            <option value="VOID">Void</option>
          </Select>
          <Select className="w-40" value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}>
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Credit">Credit</option>
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
          <EmptyState title="No sales found" description="Complete a sale from the POS to see invoices here." action={<Link to="/pos" className="btn-primary"><Plus className="h-4 w-4" /> Open POS</Link>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} onRowClick={(s) => navigate(`/sales/${s._id}`)} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}