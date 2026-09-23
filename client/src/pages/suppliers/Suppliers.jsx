import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Eye, Pencil, Building2 } from 'lucide-react';
import { supplierApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import SearchBox from '../../components/SearchBox';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import { Skeleton } from '../../components/Loading';
import useDebounce from '../../hooks/useDebounce';

const emptyForm = () => ({
  name: '',
  companyName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstNumber: '',
  notes: '',
  status: 'ACTIVE',
});

export default function Suppliers() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, debounced],
    queryFn: () => supplierApi.list({ page, limit: 15, search: debounced }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? supplierApi.update(editing._id, payload) : supplierApi.create(payload)),
    onSuccess: () => {
      toast.success(editing ? 'Supplier updated' : 'Supplier created');
      qc.invalidateQueries(['suppliers']);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save supplier'),
  });

  const submit = () => {
    if (!form.name.trim()) return toast.error('Supplier name is required');
    saveMutation.mutate(form);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, companyName: s.companyName || '', phone: s.phone || '', email: s.email || '',
      address: s.address || '', city: s.city || '', state: s.state || '', pincode: s.pincode || '',
      gstNumber: s.gstNumber || '', notes: s.notes || '', status: s.status,
    });
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      label: 'Supplier',
      render: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 className="h-4 w-4" /></div>
          <div>
            <div className="font-medium text-slate-800">{s.name}</div>
            <div className="text-xs text-slate-400">{s.companyName || s.phone || '-'}</div>
          </div>
        </div>
      ),
    },
    { key: 'phone', label: 'Phone', render: (s) => s.phone || '-' },
    { key: 'gst', label: 'GSTIN', render: (s) => s.gstNumber || '-' },
    { key: 'city', label: 'City', render: (s) => s.city || '-' },
    { key: 'status', label: 'Status', render: (s) => <Badge color={s.status === 'ACTIVE' ? 'green' : 'slate'}>{s.status}</Badge> },
    {
      key: 'actions',
      label: '',
      render: (s) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/suppliers/${s._id}`)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"><Eye className="h-4 w-4" /></button>
          <button onClick={() => openEdit(s)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Suppliers" subtitle="Manage your vendors and their dues"
        actions={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Supplier</Button>} />
      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <SearchBox className="max-w-sm" value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, company, phone, GST..." />
        </div>
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No suppliers found" description="Add your first supplier to record purchases." action={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Supplier</Button>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} onRowClick={(s) => navigate(`/suppliers/${s._id}`)} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} Supplier`} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saveMutation.isLoading}>Save</Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Company Name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
          <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            <Input label="GSTIN" value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}