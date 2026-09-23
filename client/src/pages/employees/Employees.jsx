import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, KeyRound, User as UserIcon } from 'lucide-react';
import { userApi } from '../../api';
import { ROLES, ROLE_LABELS } from '../../constants';
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
import { RoleBadge } from '../../components/Badge';
import Badge from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import { formatDateTime } from '../../utils/format';
import useDebounce from '../../hooks/useDebounce';

const emptyForm = () => ({ name: '', email: '', phone: '', role: '', password: '' });
const PASSWORD_ATTRS = 'Password must be at least 6 characters.';

export default function Employees() {
  const qc = useQueryClient();
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('mathi_user') || '{}');
    } catch {
      return {};
    }
  }, []);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [resetFor, setResetFor] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, debounced],
    queryFn: () => userApi.list({ page, limit: 15, search: debounced }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? userApi.update(editing._id, payload) : userApi.create(payload)),
    onSuccess: () => {
      toast.success(editing ? 'Employee updated' : 'Employee created');
      qc.invalidateQueries(['users']);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save employee'),
  });

  const resetMutation = useMutation({
    mutationFn: () => userApi.resetPassword(resetFor._id, { password: newPassword }),
    onSuccess: () => {
      toast.success('Password reset');
      qc.invalidateQueries(['users']);
      setResetFor(null);
      setNewPassword('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Reset failed'),
  });

  const delMutation = useMutation({
    mutationFn: (id) => userApi.remove(id),
    onSuccess: () => {
      toast.success('Employee deleted');
      qc.invalidateQueries(['users']);
      setToDelete(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });

  const submit = () => {
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    if (!form.role) return toast.error('Role is required');
    if (!editing && form.password.length < 6) return toast.error(PASSWORD_ATTRS);
    const payload = { name: form.name, email: form.email, phone: form.phone || undefined, role: form.role };
    saveMutation.mutate(editing ? payload : { ...payload, password: form.password });
  };

  const columns = [
    {
      key: 'name',
      label: 'Employee',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><UserIcon className="h-4 w-4" /></div>
          <div>
            <div className="font-medium text-slate-800">{u.name}{u._id === me._id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</div>
            <div className="text-xs text-slate-400">{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (u) => u.phone || '-' },
    { key: 'role', label: 'Role', render: (u) => <RoleBadge role={u.role} /> },
    { key: 'status', label: 'Status', render: (u) => <Badge color={u.status === 'ACTIVE' ? 'green' : 'slate'}>{u.status}</Badge> },
    { key: 'lastLogin', label: 'Last Login', render: (u) => (u.lastLogin ? formatDateTime(u.lastLogin) : 'Never') },
    {
      key: 'actions',
      label: '',
      render: (u) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setResetFor(u)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600"><KeyRound className="h-4 w-4" /></button>
          <button onClick={() => { setEditing(u); setForm({ name: u.name, email: u.email, phone: u.phone || '', role: u.role, password: '' }); setModalOpen(true); }} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
          {u._id !== me._id && (
            <button onClick={() => setToDelete(u)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Employees" subtitle="Manage staff accounts and roles"
        actions={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Employee</Button>} />
      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <SearchBox className="max-w-sm" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or email..." />
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No employees found" description="Add staff who can use the POS." action={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Employee</Button>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} Employee`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saveMutation.isLoading}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Role *" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="">Select role...</option>
            {Object.entries(ROLES).map(([k, v]) => <option key={v} value={v}>{ROLE_LABELS[k]}</option>)}
          </Select>
          {!editing && (
            <>
              <Input label="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-xs text-slate-400">{PASSWORD_ATTRS}</p>
            </>
          )}
          <p className="rounded bg-slate-50 p-2 text-xs text-slate-500">
            Admin: everything · Manager: +credit/partial · Cashier: billing · Staff: view-only helpers
          </p>
        </div>
      </Modal>

      <Modal open={!!resetFor} onClose={() => { setResetFor(null); setNewPassword(''); }} title={`Reset Password — ${resetFor?.name}`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setResetFor(null); setNewPassword(''); }}>Cancel</Button>
            <Button onClick={() => resetMutation.mutate()} loading={resetMutation.isLoading} disabled={newPassword.length < 6}>Reset</Button>
          </>
        }
      >
        <Input label="New Password *" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <p className="mt-2 text-xs text-slate-400">{PASSWORD_ATTRS}</p>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Employee?"
        message={`${toDelete?.name} will lose access to the system.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => delMutation.mutate(toDelete._id)}
        loading={delMutation.isLoading}
      />
    </div>
  );
}