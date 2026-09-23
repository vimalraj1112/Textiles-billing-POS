import api from './client';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const dashboardApi = {
  get: (params) => api.get('/dashboard', { params }),
};

export const productApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  searchPOS: (params) => api.get('/products/search/pos', { params }),
};

export const masterApi = {
  list: (base, params) => api.get(`/${base}`, { params }),
  create: (base, data) => api.post(`/${base}`, data),
  update: (base, id, data) => api.put(`/${base}/${id}`, data),
  remove: (base, id) => api.delete(`/${base}/${id}`),
};

export const inventoryApi = {
  list: (params) => api.get('/inventory', { params }),
  movements: (params) => api.get('/inventory/movements', { params }),
  adjust: (data) => api.post('/inventory/adjust', data),
  lowStock: () => api.get('/inventory/low-stock'),
};

export const customerApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  search: (q) => api.get('/customers/search', { params: { q } }),
  quick: (data) => api.post('/customers/quick', data),
};

export const supplierApi = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
};

export const purchaseApi = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  pay: (id, data) => api.post(`/purchases/${id}/pay`, data),
};

export const saleApi = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  validateCoupon: (data) => api.post('/sales/validate-coupon', data),
  hold: (data) => api.post('/sales/hold', data),
  held: () => api.get('/sales/held'),
  completeHeld: (id, data) => api.post(`/sales/held/${id}/complete`, data),
  void: (id) => api.post(`/sales/${id}/void`),
};

export const returnApi = {
  salesList: (params) => api.get('/returns/sales', { params }),
  purchaseReturns: (params) => api.get('/returns/purchases', { params }),
  createSalesReturn: (data) => api.post('/returns/sales', data),
  createPurchaseReturn: (data) => api.post('/returns/purchases', data),
  validateReturnable: (saleId) => api.get(`/returns/sale/${saleId}`),
};

export const expenseApi = {
  list: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
  categories: () => api.get('/expenses/categories'),
};

export const reportApi = {
  sales: (params) => api.get('/reports/sales', { params }),
  products: (params) => api.get('/reports/products', { params }),
  categories: (params) => api.get('/reports/categories', { params }),
  payments: (params) => api.get('/reports/payments', { params }),
  profit: (params) => api.get('/reports/profit', { params }),
  expenses: (params) => api.get('/reports/expenses', { params }),
  stockValue: () => api.get('/reports/stock-value'),
};

export const userApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  readAll: () => api.post('/notifications/read-all'),
  read: (id) => api.post(`/notifications/${id}/read`),
};

export const couponApi = {
  list: (params) => api.get('/coupons', { params }),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  remove: (id) => api.delete(`/coupons/${id}`),
};

export const uploadApi = {
  upload: (files) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('images', f));
    return api.post('/uploads', fd);
  },
};