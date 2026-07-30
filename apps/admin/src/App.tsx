import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import NewsletterPage from './pages/NewsletterPage';
import CustomersPage from './pages/CustomersPage';
import StaffPage from './pages/StaffPage';
import RolesPage from './pages/RolesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

import { Toaster } from 'sonner';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="newsletter" element={<NewsletterPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="users" element={<Navigate to="/customers" replace />} />
          <Route path="system/staff" element={<StaffPage />} />
          <Route path="system/roles" element={<RolesPage />} />
          <Route path="system/settings" element={<SettingsPage />} />
          <Route path="settings" element={<Navigate to="/system/settings" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
