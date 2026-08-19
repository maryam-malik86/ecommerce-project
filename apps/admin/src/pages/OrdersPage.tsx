import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { OrderStatusBadge, PaymentBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import {
  ShoppingBag, Clock, Package, CheckCircle2, AlertTriangle, Search,
  Plus, Download, Trash2, Filter, ChevronLeft, ChevronRight, Eye,
  X, UserCheck, PlusCircle, ArrowUpDown, DollarSign, CheckSquare, Square
} from 'lucide-react';

interface OrderItem {
  id: number;
  variant_id: number;
  quantity: number;
  unit_selling_price: string;
  line_total: string;
  product_name?: string;
  variant_label?: string;
  variant_sku?: string;
}

interface Order {
  id: number;
  order_number?: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  shipping_address: any;
  notes?: string;
  items?: OrderItem[];
}

interface ProductVariant {
  id: number;
  option_label: string;
  selling_price: string;
  stock_quantity: number;
}

interface Product {
  id: number;
  name: string;
  variants?: ProductVariant[];
}

interface UserOption {
  id: number;
  name: string;
  email: string;
}

interface ManualOrderItem {
  variant_id: string;
  quantity: number;
  unit_price: number;
}

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

const PAYMENT_STATUSES = ['unpaid', 'paid', 'partially_paid', 'refunded'];

async function fetchOrders(paramsObj: Record<string, string>) {
  const params = new URLSearchParams(paramsObj);
  const { data } = await api.get(`/orders?${params.toString()}`);
  return {
    orders: (data.data || []) as Order[],
    pagination: data.pagination || { page: 1, limit: 50, total: 0, total_pages: 1 },
  };
}

async function fetchProducts() {
  const { data } = await api.get('/catalog/products?limit=200');
  return (data.data || []) as Product[];
}

async function fetchUsers() {
  const { data } = await api.get('/users?limit=100');
  return (data.data || []) as UserOption[];
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  // Filters & State
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') || searchParams.get('id') || '');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Row selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  // Modals state
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [updateOrder, setUpdateOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');

  // Manual Order Creation Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<ManualOrderItem[]>([
    { variant_id: '', quantity: 1, unit_price: 0 },
  ]);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    phone: '',
  });
  const [notes, setNotes] = useState('');

  // Queries
  const queryParams = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      limit: String(limit),
      sort,
    };
    if (statusFilter) p['status'] = statusFilter;
    if (paymentFilter) p['payment_status'] = paymentFilter;
    if (search) p['search'] = search;
    return p;
  }, [page, limit, statusFilter, paymentFilter, search, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', queryParams],
    queryFn: () => fetchOrders(queryParams),
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-orders'],
    queryFn: fetchProducts,
  });

  const { data: users } = useQuery({
    queryKey: ['users-for-orders'],
    queryFn: fetchUsers,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, total_pages: 1 };

  // All flattened variants for dropdown
  const allVariants = useMemo(() => {
    return (products ?? []).flatMap((p) =>
      (p.variants ?? []).map((v) => ({
        ...v,
        product_name: p.name,
      }))
    );
  }, [products]);

  // Metric KPI Cards Calculations
  const metrics = useMemo(() => {
    const totalCount = pagination.total || orders.length;
    const totalRev = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pendingCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;
    const fulfillmentCount = orders.filter((o) => o.status === 'processing' || o.status === 'shipped').length;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const cancelledCount = orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded').length;

    return {
      totalCount,
      totalRev,
      pendingCount,
      fulfillmentCount,
      deliveredCount,
      cancelledCount,
    };
  }, [orders, pagination.total]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, status, payment_status }: { id: number; status: string; payment_status?: string }) =>
      api.patch(`/orders/${id}/status`, { status, ...(payment_status && { payment_status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setUpdateOrder(null);
      toast.success('Order status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/orders/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setDeleteId(null);
      toast.success('Order deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: string }) =>
      api.patch('/orders/bulk-status', { ids, status }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setSelectedIds([]);
      setBulkStatus('');
      toast.success(`${variables.ids.length} orders updated to ${variables.status.toUpperCase()}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk status update failed');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => api.post('/orders/bulk-delete', { ids }),
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      toast.success(`${ids.length} orders deleted`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Bulk deletion failed');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: (body: object) => api.post('/orders', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCreateOpen(false);
      // Reset form
      setOrderItems([{ variant_id: '', quantity: 1, unit_price: 0 }]);
      setSelectedUserId('');
      setShippingAddress({
        full_name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'US',
        phone: '',
      });
      setNotes('');
      toast.success('Manual order created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create manual order');
    },
  });

  // Table selection logic
  const isAllSelected = orders.length > 0 && selectedIds.length === orders.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Manual Order Handlers
  const handleAddLineItem = () => {
    setOrderItems((prev) => [...prev, { variant_id: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, variantIdStr: string) => {
    const variantId = Number(variantIdStr);
    const found = allVariants.find((v) => v.id === variantId);
    const price = found ? Number(found.selling_price) : 0;

    setOrderItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, variant_id: variantIdStr, unit_price: price } : item
      )
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  };

  const calcOrderTotal = useMemo(() => {
    return orderItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  }, [orderItems]);

  const handleManualOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = orderItems
      .filter((it) => it.variant_id && it.quantity > 0)
      .map((it) => ({
        variant_id: Number(it.variant_id),
        quantity: Number(it.quantity),
      }));

    if (validItems.length === 0) {
      toast.error('Please add at least one valid product variant to the order');
      return;
    }

    createOrderMutation.mutate({
      items: validItems,
      shipping_address: shippingAddress,
      notes: notes || undefined,
    });
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!orders.length) {
      toast.error('No orders available to export');
      return;
    }

    const headers = ['Order ID', 'Order Ref', 'Customer Name', 'Customer Email', 'Status', 'Payment Status', 'Total Amount ($)', 'Date Placed'];
    const rows = orders.map((o) => [
      o.id,
      o.order_number || `ORD-${o.id}`,
      `"${o.user_name || 'Guest'}"`,
      `"${o.user_email || 'N/A'}"`,
      o.status,
      o.payment_status,
      Number(o.total_amount).toFixed(2),
      `"${new Date(o.created_at).toLocaleString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders exported to CSV');
  };

  const openUpdateModal = (order: Order) => {
    setUpdateOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.payment_status);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Order Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Track sales volume, process customer orders, manage status updates, and view invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700/60 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
          <button
            id="create-order-btn"
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create Manual Order
          </button>
        </div>
      </div>

      {/* Metric KPI Cards (Replacing Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: All Orders & Gross Revenue */}
        <div
          onClick={() => {
            setStatusFilter('');
            setPage(1);
          }}
          className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            statusFilter === ''
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-zinc-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Total Revenue & Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              ${metrics.totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-zinc-400 mt-1">
              <span>{metrics.totalCount} total orders</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">All Statuses</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Action */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'pending' ? '' : 'pending');
            setPage(1);
          }}
          className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            statusFilter === 'pending'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-300 dark:hover:border-zinc-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending Action
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.pendingCount}
            </div>
            <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-zinc-400 mt-1">
              <span>Needs fulfillment</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">Filter Pending</span>
            </div>
          </div>
        </div>

        {/* Card 3: In Fulfillment */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'processing' ? '' : 'processing');
            setPage(1);
          }}
          className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            statusFilter === 'processing' || statusFilter === 'shipped'
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-zinc-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              In Fulfillment
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.fulfillmentCount}
            </div>
            <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-zinc-400 mt-1">
              <span>Processing & Shipped</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">Filter In Transit</span>
            </div>
          </div>
        </div>

        {/* Card 4: Delivered / Completed */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'delivered' ? '' : 'delivered');
            setPage(1);
          }}
          className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            statusFilter === 'delivered'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-zinc-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Delivered
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.deliveredCount}
            </div>
            <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-zinc-400 mt-1">
              <span>Completed orders</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Filter Delivered</span>
            </div>
          </div>
        </div>

        {/* Card 5: Cancelled / Refunded */}
        <div
          onClick={() => {
            setStatusFilter(statusFilter === 'cancelled' ? '' : 'cancelled');
            setPage(1);
          }}
          className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
            statusFilter === 'cancelled' || statusFilter === 'refunded'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 shadow-sm'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-rose-300 dark:hover:border-zinc-700 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Cancelled / Refunded
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {metrics.cancelledCount}
            </div>
            <div className="flex items-center justify-between text-2xs text-slate-500 dark:text-zinc-400 mt-1">
              <span>Aborted transactions</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">Filter Cancelled</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar — Search, Filters & Sort */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              id="order-search"
              type="text"
              placeholder="Search order #, customer name, email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
            >
              <option value="">All Fulfillment Statuses</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Dropdown */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map((ps) => (
              <option key={ps} value={ps}>
                Payment: {ps.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>

          {/* Reset Filters button if any active */}
          {(statusFilter || paymentFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setPaymentFilter('');
                setSearch('');
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="amount_high">Sort: Total Amount (High to Low)</option>
            <option value="amount_low">Sort: Total Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-indigo-900 text-white shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <span className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            <span>orders selected</span>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={bulkStatus}
              onChange={(e) => {
                const st = e.target.value;
                setBulkStatus(st);
                if (st) {
                  bulkStatusMutation.mutate({ ids: selectedIds, status: st });
                }
              }}
              className="px-3 py-1.5 text-xs rounded-xl bg-indigo-800 text-white border border-indigo-700 focus:outline-none"
            >
              <option value="">Bulk Update Status…</option>
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>Mark as {st.toUpperCase()}</option>
              ))}
            </select>

            <button
              onClick={() => setBulkDeleteOpen(true)}
              className="px-3 py-1.5 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Bulk Delete
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-indigo-200 hover:text-white underline ml-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Orders Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={8} />
        ) : !orders.length ? (
          <EmptyState
            title="No orders found"
            description="Adjust your search query or filters, or create a new manual order."
            action={
              <button onClick={() => setCreateOpen(true)} className="btn-primary">
                Create Manual Order
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-4 py-3.5 w-10">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Order Ref</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5 text-right">Total</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                {orders.map((order) => {
                  const isSelected = selectedIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleSelectRow(order.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        <Link
                          to={`/orders/${order.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline flex items-center gap-1"
                        >
                          #{order.id}
                          {order.order_number && (
                            <span className="text-2xs font-normal text-slate-400">
                              ({order.order_number})
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {order.user_name || 'Guest Customer'}
                        </div>
                        <div className="text-2xs font-mono text-slate-400 dark:text-zinc-500">
                          {order.user_email || 'No email provided'}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        <PaymentBadge status={order.payment_status} />
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white text-right">
                        ${Number(order.total_amount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <Link
                            to={`/orders/${order.id}`}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                            title="View Full Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openUpdateModal(order)}
                            className="px-2.5 py-1 text-2xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => setDeleteId(order.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(page * limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> orders
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Page size:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 text-slate-700 dark:text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-semibold text-slate-900 dark:text-white">
                  {page} / {pagination.total_pages || 1}
                </span>
                <button
                  disabled={page >= (pagination.total_pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 text-slate-700 dark:text-zinc-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Multi-Item Manual Order Creation Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Manual Order"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button
              id="submit-create-order"
              form="create-order-form"
              type="submit"
              className="btn-primary"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Placing Order…' : 'Create & Process Order'}
            </button>
          </>
        }
      >
        <form id="create-order-form" onSubmit={handleManualOrderSubmit} className="space-y-5">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
              Customer Assignment (Optional)
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                const uid = e.target.value;
                setSelectedUserId(uid);
                const userObj = (users ?? []).find((u) => u.id === Number(uid));
                if (userObj) {
                  setShippingAddress((prev) => ({
                    ...prev,
                    full_name: userObj.name,
                  }));
                }
              }}
              className="select w-full"
            >
              <option value="">Guest Customer / Manual Input</option>
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-3.5 bg-slate-50/50 dark:bg-zinc-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Order Line Items ({orderItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Product Item
              </button>
            </div>

            <div className="space-y-2.5">
              {orderItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-2xs"
                >
                  <div className="flex-1">
                    <select
                      required
                      value={item.variant_id}
                      onChange={(e) => handleVariantChange(idx, e.target.value)}
                      className="select w-full text-xs"
                    >
                      <option value="">Select Product Variant…</option>
                      {allVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.product_name} — {v.option_label} (${Number(v.selling_price).toFixed(2)}) [{v.stock_quantity} in stock]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                      placeholder="Qty"
                      className="input text-xs"
                    />
                  </div>

                  <div className="w-28 text-right font-bold text-xs text-slate-900 dark:text-white px-2">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </div>

                  {orderItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 text-sm font-bold border-t border-slate-200 dark:border-zinc-700">
              <span className="text-slate-500">Calculated Net Total</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-base">
                ${calcOrderTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Shipping Address Inputs */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Shipping & Recipient Address
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                required
                placeholder="Full Name *"
                value={shippingAddress.full_name}
                onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                className="input text-xs"
              />
              <input
                required
                placeholder="Phone Number *"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                className="input text-xs"
              />
            </div>

            <input
              required
              placeholder="Street Address Line 1 *"
              value={shippingAddress.address_line1}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
              className="input text-xs"
            />

            <input
              placeholder="Address Line 2 / Suite (Optional)"
              value={shippingAddress.address_line2}
              onChange={(e) => setShippingAddress({ ...shippingAddress, address_line2: e.target.value })}
              className="input text-xs"
            />

            <div className="grid grid-cols-3 gap-2.5">
              <input
                required
                placeholder="City *"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="input text-xs"
              />
              <input
                required
                placeholder="State / Province *"
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                className="input text-xs"
              />
              <input
                required
                placeholder="Postal Code *"
                value={shippingAddress.postal_code}
                onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                className="input text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-zinc-300">
              Order Notes / Internal Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Add any specific notes for fulfillment or delivery..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input text-xs"
            />
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateOrder !== null}
        onClose={() => setUpdateOrder(null)}
        title={`Update Order #${updateOrder?.id}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setUpdateOrder(null)}>
              Cancel
            </button>
            <button
              id="status-update-save"
              className="btn-primary"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateOrder &&
                updateMutation.mutate({
                  id: updateOrder.id,
                  status: newStatus,
                  payment_status: newPaymentStatus,
                })
              }
            >
              {updateMutation.isPending ? 'Saving…' : 'Save Status'}
            </button>
          </>
        }
      >
        {updateOrder && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">
                Fulfillment Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="select w-full"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">
                Payment Status
              </label>
              <select
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value)}
                className="select w-full"
              >
                {PAYMENT_STATUSES.map((ps) => (
                  <option key={ps} value={ps}>
                    {ps.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Single Order Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Order"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Order'}
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-zinc-400">
          Are you sure you want to delete order #{deleteId}? This action cannot be undone and will remove itemized records.
        </p>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title="Bulk Delete Orders"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? 'Deleting…' : `Delete ${selectedIds.length} Orders`}
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-600 dark:text-zinc-400">
          Are you sure you want to permanently delete {selectedIds.length} selected orders?
        </p>
      </Modal>
    </div>
  );
}
