import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { inventoryApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import Select from '../../components/Select';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { formatDateTime } from '../../utils/format';
import { MOVEMENT_TYPES } from '../../constants/masters';

export default function Movements() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['movements', page, type],
    queryFn: () => inventoryApi.movements({ page, limit: 20, type: type || undefined }).then((r) => r.data.data),
  });

  const typeColor = (t) => {
    const map = {
      PURCHASE: 'green',
      SALE: 'blue',
      SALE_RETURN: 'green',
      PURCHASE_RETURN: 'red',
      DAMAGE: 'red',
      ADJUSTMENT: 'amber',
      TRANSFER: 'purple',
    };
    return map[t] || 'slate';
  };

  const columns = [
    { key: 'createdAt', label: 'Date/Time', render: (m) => formatDateTime(m.createdAt) },
    { key: 'product', label: 'Product', render: (m) => m.product?.name || '-' },
    {
      key: 'type',
      label: 'Type',
      render: (m) => (
        <Badge color={typeColor(m.type)}>
          {m.type.startsWith('SALE') ? <ArrowDownLeft className="mr-1 inline h-3 w-3" /> : <ArrowUpRight className="mr-1 inline h-3 w-3" />}
          {m.type.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      label: 'Qty',
      render: (m) => <span className={m.quantity >= 0 ? 'text-emerald-600' : 'text-red-600'}>{m.quantity >= 0 ? '+' : ''}{m.quantity}</span>,
    },
    {
      key: 'stock',
      label: 'Stock Before → After',
      render: (m) => `${m.previousStock} → ${m.newStock}`,
    },
    { key: 'reason', label: 'Reference / Reason', render: (m) => m.reason || '-' },
    { key: 'user', label: 'By', render: (m) => m.user?.name || '-' },
  ];

  return (
    <div>
      <PageHeader title="Stock Movements" subtitle="Complete audit trail of every stock change"
        actions={<Link to="/inventory" className="btn-secondary">Back to Inventory</Link>} />
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Select className="w-52" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </Select>
        </div>
        {isLoading ? (
          <Skeleton rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No movements found" description="Stock changes from sales, purchases, returns and adjustments appear here." />
        ) : (
          <>
            <Table columns={columns} data={data.items} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}