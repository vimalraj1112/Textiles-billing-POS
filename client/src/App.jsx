import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/pos/POS';
import Products from './pages/products/Products';
import ProductForm from './pages/products/ProductForm';
import ProductDetail from './pages/products/ProductDetail';
import Inventory from './pages/inventory/Inventory';
import Movements from './pages/inventory/Movements';
import MasterList from './pages/masters/MasterList';
import Purchases from './pages/purchases/Purchases';
import PurchaseForm from './pages/purchases/PurchaseForm';
import PurchaseDetail from './pages/purchases/PurchaseDetail';
import Suppliers from './pages/suppliers/Suppliers';
import SupplierDetail from './pages/suppliers/SupplierDetail';
import Customers from './pages/customers/Customers';
import CustomerDetail from './pages/customers/CustomerDetail';
import Sales from './pages/sales/Sales';
import SaleDetail from './pages/sales/SaleDetail';
import Returns from './pages/returns/Returns';
import Expenses from './pages/expenses/Expenses';
import Reports from './pages/reports/Reports';
import Employees from './pages/employees/Employees';
import AuditLogs from './pages/settings/AuditLogs';
import Settings from './pages/settings/Settings';
import BarcodeLabels from './pages/products/BarcodeLabels';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pos" element={<POS />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/barcode-labels" element={<BarcodeLabels />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="inventory/movements" element={<Movements />} />
        <Route path="categories" element={<MasterList base="categories" title="Categories" />} />
        <Route path="brands" element={<MasterList base="brands" title="Brands" />} />
        <Route path="sizes" element={<MasterList base="sizes" title="Sizes" />} />
        <Route path="colors" element={<MasterList base="colors" title="Colors" />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="purchases/new" element={<PurchaseForm />} />
        <Route path="purchases/:id" element={<PurchaseDetail />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierDetail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="sales" element={<Sales />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        <Route path="returns" element={<Returns />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/sales" element={<Reports tab="sales" />} />
        <Route path="reports/products" element={<Reports tab="products" />} />
        <Route path="reports/payments" element={<Reports tab="payments" />} />
        <Route path="reports/profit" element={<Reports tab="profit" />} />
        <Route path="employees" element={<Employees />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}