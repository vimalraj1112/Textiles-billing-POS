import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { masterApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import useDebounce from '../../hooks/useDebounce';

export default function MasterList({ base, title }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', hex: '#000000', sortOrder: 0, status: 'ACTIVE' });

  const { data, isLoading } = useQuery({
    queryKey: [base, page, debounced],
    queryFn: () => masterApi.list(base, { page, limit: 20, search: debounced }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? masterApi.update(base, editing._id, payload) : masterApi.create(base, payload)),
    onSuccess: () => {
      toast.success(editing ? `${title.slice(0, -1)} updated` : `${title.slice(0, -1)} created`);
      qc.invalidateQueries([base]);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save'),
  });

  const delMutation = useMutation({
    mutationFn: (id) => masterApi.remove(base, id),
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries([base]);
      setToDelete(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', hex: '#000000', sortOrder: 0, status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, description: row.description || '', hex: row.hex || '#000000', sortOrder: row.sortOrder || 0, status: row.status });
    setModalOpen(true);
  };

  const submit = () => {
    if (!form.name.trim()) return toast.error('Name is required');
    const payload = { name: form.name.trim(), description: form.description || undefined, status: form.status };
    if (base === 'colors') payload.hex = form.hex;
    if (base === 'sizes') payload.sortOrder = Number(form.sortOrder) || 0;
    saveMutation.mutate(payload);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          {base === 'colors' && row.hex && <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: row.hex }} />}
          <span className="font-medium text-slate-800">{row.name}</span>
        </div>
      ),
    },
    ...(base === 'colors' ? [{ key: 'hex', label: 'Hex', render: (row) => row.hex || '-' }] : []),
    ...(base === 'sizes' ? [{ key: 'sortOrder', label: 'Order', render: (row) => row.sortOrder }] : []),
    ...(base === 'categories' || base === 'brands' ? [{ key: 'description', label: 'Description', render: (row) => row.description || '-' }] : []),
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge color={row.status === 'ACTIVE' ? 'green' : 'slate'}>{row.status}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openEdit(row)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setToDelete(row)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle="Manage your master data"
        actions={
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add {title.slice(0, -1)}</Button>
        }
      />
      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <SearchBox className="max-w-sm" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={`Search ${title.toLowerCase()}...`} />
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title={`No ${title.toLowerCase()} found`} action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add {title.slice(0, -1)}</Button>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} ${title.slice(0, -1)}`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saveMutation.isLoading}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          {base === 'colors' && (
            <div className="flex items-center gap-3">
              <input type="color" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} className="h-10 w-14 cursor-pointer rounded border" />
              <Input label="Hex" value={form.hex} onChange={(e) => setForm({ ...form, hex: e.target.value })} />
              <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          {base !== 'colors' && <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
          {(base === 'categories' || base === 'brands') && (
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          )}
          {base === 'sizes' && (
            <Input label="Sort Order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
          )}
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title={`Delete ${title.slice(0, -1)}?`}
        message={`${toDelete?.name} — cannot be deleted if it is used by existing products. Deactivate instead in that case.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => delMutation.mutate(toDelete._id)}
        loading={delMutation.isLoading}
      />
    </div>
  );
}