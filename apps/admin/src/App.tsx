import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { TableSkeleton } from './components/ui/Spinner';
import { Toaster } from 'sonner';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const CreateProductPage = lazy(() => import('./pages/CreateProductPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const CustomerDetailPage = lazy(() => import('./pages/CustomerDetailPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<CreateProductPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="newsletter" element={<NewsletterPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerDetailPage />} />
              <Route path="users" element={<Navigate to="/customers" replace />} />
              <Route path="system/staff" element={<StaffPage />} />
              <Route path="system/roles" element={<RolesPage />} />
              <Route path="system/settings" element={<SettingsPage />} />
              <Route path="settings" element={<Navigate to="/system/settings" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
