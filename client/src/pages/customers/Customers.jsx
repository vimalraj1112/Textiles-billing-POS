import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Eye, Pencil, User } from 'lucide-react';
import { customerApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { formatRupees } from '../../utils/format';
import useDebounce from '../../hooks/useDebounce';

const emptyForm = () => ({
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  notes: '',
  status: 'ACTIVE',
});

export default function Customers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, debounced],
    queryFn: () => customerApi.list({ page, limit: 15, search: debounced }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? customerApi.update(editing._id, payload) : customerApi.create(payload)),
    onSuccess: () => {
      toast.success(editing ? 'Customer updated' : 'Customer created');
      qc.invalidateQueries(['customers']);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save customer'),
  });

  const submit = () => {
    if (!form.name.trim()) return toast.error('Customer name is required');
    saveMutation.mutate(form);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '',
      city: c.city || '', state: c.state || '', pincode: c.pincode || '', notes: c.notes || '',
      status: c.status,
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><User className="h-4 w-4" /></div>
          <div>
            <div className="font-medium text-slate-800">{c.name}</div>
            <div className="text-xs text-slate-400">{c.phone || c.email || '-'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'totalPurchases',
      label: 'Total Purchases',
      render: (c) => <span className="font-medium">{formatRupees(c.totalPurchases)}</span>,
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      render: (c) => (
        <span className={c.outstandingAmount > 0 ? 'font-medium text-red-600' : 'text-slate-400'}>{formatRupees(c.outstandingAmount)}</span>
      ),
    },
    { key: 'loyaltyPoints', label: 'Loyalty Pts', render: (c) => c.loyaltyPoints },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/customers/${c._id}`)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
          <button onClick={() => openEdit(c)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage customers, dues and loyalty"
        actions={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Customer</Button>} />
      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <SearchBox className="max-w-sm" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, phone, email..." />
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No customers found" description="Add your first customer to start credit and loyalty tracking." action={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Customer</Button>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} onRowClick={(c) => navigate(`/customers/${c._id}`)} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} Customer`} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saveMutation.isLoading}>Save</Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}