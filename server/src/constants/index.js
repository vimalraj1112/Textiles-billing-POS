const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  CASHIER: 'CASHIER',
  STAFF: 'STAFF',
};

const ROLE_LIST = Object.values(ROLES);

const PRODUCT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

const STOCK_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
};

const PAYMENT_METHODS = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank Transfer',
  CREDIT: 'Credit',
};

const PAYMENT_METHOD_LIST = Object.keys(PAYMENT_METHODS);

const PAYMENT_STATUS = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  PENDING: 'PENDING',
};

const CREDIT_STATUS = {
  PAID: 'PAID',
  PARTIAL: 'PARTIAL',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
};

const MOVEMENT_TYPES = {
  PURCHASE: 'PURCHASE',
  SALE: 'SALE',
  SALE_RETURN: 'SALE_RETURN',
  PURCHASE_RETURN: 'PURCHASE_RETURN',
  DAMAGE: 'DAMAGE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER: 'TRANSFER',
};

const RETURN_REASONS = [
  'Size Issue',
  'Color Issue',
  'Defective',
  'Customer Request',
  'Wrong Product',
  'Other',
];

const RETURN_ACTION = {
  REFUND: 'REFUND',
  STORE_CREDIT: 'STORE_CREDIT',
  EXCHANGE: 'EXCHANGE',
};

const EXPENSE_CATEGORIES = {
  Rent: 'Rent',
  Electricity: 'Electricity',
  Salary: 'Salary',
  Internet: 'Internet',
  Transport: 'Transport',
  Maintenance: 'Maintenance',
  Marketing: 'Marketing',
  Packaging: 'Packaging',
  Other: 'Other',
};

const GENDERS = ['Male', 'Female', 'Unisex', 'Kids'];

const MATERIALS = ['Cotton', 'Silk', 'Polyester', 'Linen', 'Wool', 'Nylon', 'Rayon', 'Other'];

const AUDIT_ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_PRODUCT',
  'UPDATE_PRODUCT',
  'DELETE_PRODUCT',
  'CREATE_CATEGORY',
  'UPDATE_CATEGORY',
  'DELETE_CATEGORY',
  'CREATE_SALE',
  'CANCEL_SALE',
  'RETURN_SALE',
  'CREATE_PURCHASE',
  'UPDATE_STOCK',
  'CREATE_CUSTOMER',
  'UPDATE_CUSTOMER',
  'CREATE_SUPPLIER',
  'UPDATE_SUPPLIER',
  'CREATE_EXPENSE',
  'UPDATE_SETTINGS',
  'CREATE_COUPON',
  'UPDATE_COUPON',
  'CREATE_USER',
  'UPDATE_USER',
  'DELETE_USER',
  'HOLD_BILL',
];

const NOTIFICATION_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  OVERDUE_PAYMENT: 'OVERDUE_PAYMENT',
  SUPPLIER_DUE: 'SUPPLIER_DUE',
  LARGE_RETURN: 'LARGE_RETURN',
  SYSTEM: 'SYSTEM',
};

const DEFAULT_CATEGORIES = [
  'Sarees',
  'Kurtis',
  'Chudidars',
  'Lehengas',
  'Shirts',
  'T-Shirts',
  'Jeans',
  'Kids Wear',
  'Night Wear',
  'Inner Wear',
  'Accessories',
  'Other',
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];

const DEFAULT_COLORS = [
  { name: 'Red', hex: '#dc2626' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Green', hex: '#16a34a' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Purple', hex: '#9333ea' },
  { name: 'Grey', hex: '#6b7280' },
];

module.exports = {
  ROLES,
  ROLE_LIST,
  PRODUCT_STATUS,
  STOCK_STATUS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LIST,
  PAYMENT_STATUS,
  CREDIT_STATUS,
  MOVEMENT_TYPES,
  RETURN_REASONS,
  RETURN_ACTION,
  EXPENSE_CATEGORIES,
  GENDERS,
  MATERIALS,
  AUDIT_ACTIONS,
  NOTIFICATION_TYPES,
  DEFAULT_CATEGORIES,
  DEFAULT_SIZES,
  DEFAULT_COLORS,
};