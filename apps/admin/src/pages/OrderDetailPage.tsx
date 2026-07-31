import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { OrderStatusBadge, PaymentBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import {
  ArrowLeft, ShoppingBag, User, Mail, MapPin, Calendar, CreditCard,
  Printer, Edit2, ShieldCheck, CheckCircle2, Clock
} from 'lucide-react';

interface OrderItemDetail {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  unit_selling_price: string;
  line_total: string;
  product_name?: string;
  variant_sku?: string;
  variant_label?: string;
}

interface OrderDetail {
  id: number;
  user_id?: number;
  user_name?: string;
  user_email?: string;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  shipping_address: any;
  notes?: string;
  items?: OrderItemDetail[];
}

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

async function fetchOrderDetailById(id: string): Promise<OrderDetail> {
  const { data } = await api.get(`/orders/${id}`);
  return data.data as OrderDetail;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => fetchOrderDetailById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-detail', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setUpdateStatusOpen(false);
      toast.success('Order fulfillment status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    updateStatusMutation.mutate(newStatus);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Link to="/orders" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <EmptyState title="Order not found" description="The requested order specification could not be retrieved." />
      </div>
    );
  }

  const parseShipping = (addr: any) => {
    if (!addr) return 'No shipping address specified';
    if (typeof addr === 'string') return addr;
    return `${addr.street || ''}, ${addr.city || ''}, ${addr.country || 'US'}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders Management
        </Link>
        <span className="text-2xs font-mono text-slate-400 dark:text-zinc-500">
          Order Reference #{order.id}
        </span>
      </div>

      {/* Order Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-indigo-500" /> Order #{order.id}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </div>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Placed on {new Date(order.created_at).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewStatus(order.status);
              setUpdateStatusOpen(true);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" /> Update Status
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) — Itemized Products & Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Products Table Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-3">
              Itemized Purchased Products ({(order.items ?? []).length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="px-4 py-3">Product Specification</th>
                    <th className="px-4 py-3">SKU / Option</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-sm">
                  {(order.items ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {item.product_name || `Product Variant #${item.variant_id}`}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-zinc-400 font-mono">
                        {item.variant_sku || item.variant_label || 'Standard'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 dark:text-zinc-300">
                        ${Number(item.unit_selling_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white text-right">
                        ${Number(item.line_total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Financial Summary Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3 max-w-md ml-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 pb-2 border-b border-slate-200 dark:border-zinc-800">
              Financial Breakdown
            </h2>

            <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">${Number(order.total_amount).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Standard Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-slate-200 dark:border-zinc-800 pt-3 text-slate-900 dark:text-white">
              <span>Net Order Total</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-lg">${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) — Customer Info & Shipping Address */}
        <div className="space-y-6">
          {/* Customer Details Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Customer Information
            </h2>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900 dark:text-white text-sm">{order.user_name || 'Anonymous Customer'}</p>
              {order.user_email && (
                <p className="text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {order.user_email}
                </p>
              )}

              {order.user_id && (
                <Link
                  to={`/customers/${order.user_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> View Customer Profile & LTV →
                </Link>
              )}
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" /> Shipping & Delivery Address
            </h2>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-mono">
              {parseShipping(order.shipping_address)}
            </div>
          </div>

          {/* Fulfillment Status History */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Fulfillment Timeline
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">✓</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Order Created</p>
                  <p className="text-2xs text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">●</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Current Status: {order.status.toUpperCase()}</p>
                  <p className="text-2xs text-slate-400">Payment: {order.payment_status.toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Order Status Modal */}
      {updateStatusOpen && (
        <Modal
          isOpen={true}
          onClose={() => setUpdateStatusOpen(false)}
          title={`Update Fulfillment Status — Order #${order.id}`}
          size="sm"
          footer={
            <>
              <button className="btn-secondary text-xs" onClick={() => setUpdateStatusOpen(false)}>Cancel</button>
              <button
                form="update-status-form"
                type="submit"
                className="btn-primary text-xs"
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Save New Status'}
              </button>
            </>
          }
        >
          <form id="update-status-form" onSubmit={handleUpdateStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Select Fulfillment Status *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              >
                {ORDER_STATUSES.map((st) => (
                  <option key={st} value={st}>{st.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
