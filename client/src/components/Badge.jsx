import clsx from 'clsx';

const styles = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function Badge({ children, color = 'slate', className }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles[color], className)}>
      {children}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const map = {
    PAID: 'green',
    PARTIAL: 'amber',
    PENDING: 'red',
    OVERDUE: 'red',
  };
  return <Badge color={map[status] || 'slate'}>{status?.replace('_', ' ')}</Badge>;
}

export function StockBadge({ status }) {
  const map = {
    IN_STOCK: 'green',
    LOW_STOCK: 'amber',
    OUT_OF_STOCK: 'red',
  };
  return <Badge color={map[status] || 'slate'}>{status?.replace('_', ' ')}</Badge>;
}

export function RoleBadge({ role }) {
  const map = { ADMIN: 'purple', MANAGER: 'blue', CASHIER: 'amber', STAFF: 'slate' };
  return <Badge color={map[role] || 'slate'}>{role}</Badge>;
}