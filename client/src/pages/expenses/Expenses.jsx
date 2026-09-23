import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { expenseApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Table from '../../components/Table';
import Pagination from '../../components/Pagination';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import { Skeleton } from '../../components/Loading';
import { formatRupees, formatDate, todayISO } from '../../utils/format';
import { EXPENSE_CATEGORIES } from '../../constants/masters';

const emptyForm = () => ({ title: '', category: EXPENSE_CATEGORIES[0], amount: '', date: todayISO(), note: '' });

export default function Expenses() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: () => expenseApi.list({ page, limit: 15 }).then((r) => r.data.data),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing ? expenseApi.update(editing._id, payload) : expenseApi.create(payload)),
    onSuccess: () => {
      toast.success(editing ? 'Expense updated' : 'Expense added');
      qc.invalidateQueries(['expenses']);
      qc.invalidateQueries(['reports', 'profit']);
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save expense'),
  });

  const delMutation = useMutation({
    mutationFn: expenseApi.remove,
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries(['expenses']);
      setToDelete(null);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not delete'),
  });

  const submit = () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.amount) return toast.error('Amount is required');
    saveMutation.mutate({ title: form.title, category: form.category, amount: Number(form.amount), date: form.date, description: form.note || undefined });
  };

  const openEdit = (e) => {
    setEditing(e);
    setForm({ title: e.title, category: e.category, amount: (e.amount / 100).toFixed(2), date: e.date.slice(0, 10), note: e.description || '' });
    setModalOpen(true);
  };

  const columns = [
    { key: 'title', label: 'Expense', render: (e) => <span className="font-medium text-slate-800">{e.title}</span> },
    { key: 'category', label: 'Category', render: (e) => <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{e.category}</span> },
    { key: 'date', label: 'Date', render: (e) => formatDate(e.date) },
    { key: 'amount', label: 'Amount', render: (e) => <span className="font-medium">{formatRupees(e.amount)}</span> },
    { key: 'createdBy', label: 'Added By', render: (e) => e.createdBy?.name || '-' },
    { key: 'note', label: 'Note', render: (e) => e.description || '-' },
    {
      key: 'actions',
      label: '',
      render: (e) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(e)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => setToDelete(e)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Track shop operating expenses"
        actions={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Expense</Button>} />
      <div className="card">
        {isLoading ? (
          <Skeleton rows={8} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No expenses recorded" description="Add rent, electricity, salaries and other shop expenses." action={<Button onClick={() => { setEditing(null); setForm(emptyForm()); setModalOpen(true); }}><Plus className="h-4 w-4" /> Add Expense</Button>} />
        ) : (
          <>
            <Table columns={columns} data={data.items} />
            <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Edit' : 'Add'} Expense`} size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={saveMutation.isLoading}>Save</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Shop rent" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input label="Amount (₹) *" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <Input label="Date" type="date" value={form.date} max={todayISO()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete Expense?"
        message={`${toDelete?.title} of ${formatRupees(toDelete?.amount)} will be removed.`}
        onClose={() => setToDelete(null)}
        onConfirm={() => delMutation.mutate(toDelete._id)}
        loading={delMutation.isLoading}
      />
    </div>
  );
}