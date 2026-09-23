export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  STAFF: 'STAFF',
};

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  STAFF: 'Staff',
};

export const STOCK_LABELS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'];

export const REPORT_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom',
};

export function rangeDates(range) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (range) {
    case 'today':
      return { from: start, to: end };
    case 'yesterday': {
      const y = new Date(start);
      y.setDate(y.getDate() - 1);
      return { from: y, to: new Date(y).setHours(23, 59, 59, 999) };
    }
    case 'this_week': {
      const day = (start.getDay() + 6) % 7;
      start.setDate(start.getDate() - day);
      return { from: start, to: end };
    }
    case 'this_month':
      start.setDate(1);
      return { from: start, to: end };
    case 'this_year':
      start.setMonth(0, 1);
      return { from: start, to: end };
    default:
      return { from: start, to: end };
  }
}