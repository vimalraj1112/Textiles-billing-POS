import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import Input from '../../components/Input';
import Badge from '../../components/Badge';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { formatDateTime } from '../../utils/format';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', page, from, to],
    queryFn: () => auditApi.list({ page, limit: 20, from: from || undefined, to: to || undefined }).then((r) => r.data.data),
  });

  const actionColor = (action) => {
    if (action?.includes('DELETE')) return 'red';
    if (action?.includes('CREATE')) return 'green';
    if (action?.includes('UPDATE')) return 'amber';
    return 'slate';
  };

  const columns = [
    { key: 'createdAt', label: 'Time', render: (l) => formatDateTime(l.createdAt) },
    { key: 'user', label: 'User', render: (l) => <span className="font-medium">{l.user?.name || '-'}</span> },
    { key: 'action', label: 'Action', render: (l) => <Badge color={actionColor(l.action)}>{l.action}</Badge> },
    { key: 'entity', label: 'Entity', render: (l) => <span className="text-xs text-slate-500">{l.entity} {l.entityId ? `(${l.entityId.slice(-6)})` : ''}</span> },
    { key: 'description', label: 'Description', render: (l) => <span className="text-slate-600">{l.description || '-'}</span> },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every critical action, tracked" />
      <div className="card">
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-100 p-4">
          <Input type="date" className="w-44" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <span className="text-xs text-slate-400">to</span>
          <Input type="date" className="w-44" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </div>
        {isLoading ? (
          <Skeleton rows={10} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No audit logs" description="Actions like logins, sales, purchases and settings changes will appear here." />
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