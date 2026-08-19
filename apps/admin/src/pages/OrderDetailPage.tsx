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
  Printer, Edit2, ShieldCheck, CheckCircle2, Clock, Truck, Copy,
  Check, ExternalLink, PackageCheck, AlertCircle
} from 'lucide-react';

interface OrderItemDetail {
  id: number;
  order_id: number;
  variant_id: number;
  quantity: number;
  unit_cost_price?: string;
  unit_selling_price: string;
  line_total: string;
  product_name?: string;
  variant_sku?: string;
  variant_label?: string;
}

interface OrderDetail {
  id: number;
  order_number?: string;
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
const PAYMENT_STATUSES = ['unpaid', 'paid', 'partially_paid', 'refunded'];

const FULFILLMENT_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

async function fetchOrderDetailById(id: string): Promise<OrderDetail> {
  const { data } = await api.get(`/orders/${id}`);
  return data.data as OrderDetail;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPaymentStatus, setNewPaymentStatus] = useState('');
  const [copied, setCopied] = useState(false);

  // Tracking details state
  const [carrier, setCarrier] = useState('FedEx Express');
  const [trackingNumber, setTrackingNumber] = useState('TRK-9842104928');
  const [isEditingTracking, setIsEditingTracking] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => fetchOrderDetailById(id!),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, payment_status }: { status: string; payment_status?: string }) =>
      api.patch(`/orders/${id}/status`, { status, ...(payment_status && { payment_status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-detail', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      setUpdateStatusOpen(false);
      toast.success('Order fulfillment and payment status updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    },
  });

  const handleUpdateStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    updateStatusMutation.mutate({ status: newStatus, payment_status: newPaymentStatus });
  };

  const handlePrint = () => {
    window.print();
  };

  const copyAddressToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Shipping address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
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
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
        <EmptyState title="Order not found" description="The requested order specification could not be retrieved." />
      </div>
    );
  }

  const formatAddress = (addr: any) => {
    if (!addr) return 'No shipping address provided';
    if (typeof addr === 'string') return addr;

    const parts = [
      addr.full_name || addr.name,
      addr.address_line1 || addr.street,
      addr.address_line2,
      [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
      addr.country || 'US',
      addr.phone ? `Phone: ${addr.phone}` : null,
    ].filter(Boolean);

    return parts.join('\n');
  };

  const addressText = formatAddress(order.shipping_address);

  // Stepper progress index
  const currentStepIndex = FULFILLMENT_STEPS.findIndex((s) => s.key === order.status);
  const isCancelledOrRefunded = order.status === 'cancelled' || order.status === 'refunded';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders Management
        </Link>
        <span className="text-2xs font-mono text-slate-400 dark:text-zinc-500">
          Order Reference #{order.id} {order.order_number ? `(${order.order_number})` : ''}
        </span>
      </div>

      {/* Order Header Banner */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Order #{order.id}
            </h1>
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.payment_status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Placed on{' '}
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              {new Date(order.created_at).toLocaleString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={() => {
              setNewStatus(order.status);
              setNewPaymentStatus(order.payment_status);
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

      {/* Fulfillment Status Stepper */}
      {!isCancelledOrRefunded ? (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4 print:hidden">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-indigo-500" /> Fulfillment Progress Stepper
          </h2>

          <div className="relative flex items-center justify-between">
            {/* Background line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-zinc-800 -z-0 rounded-full" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 -z-0 rounded-full"
              style={{
                width: `${
                  currentStepIndex < 0 ? 0 : (currentStepIndex / (FULFILLMENT_STEPS.length - 1)) * 100
                }%`,
              }}
            />

            {FULFILLMENT_STEPS.map((step, idx) => {
              const isCompleted = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isCompleted
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 dark:ring-indigo-950 shadow-md'
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`mt-2 text-2xs font-semibold whitespace-nowrap ${
                      isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : isCompleted
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 flex items-center gap-3 text-xs font-semibold print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <span>
            This order status is currently marked as{' '}
            <strong className="uppercase">{order.status}</strong>. Standard fulfillment flow is halted.
          </span>
        </div>
      )}

      {/* Main 2-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) — Products & Financial Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
              <span>Itemized Purchased Products ({(order.items ?? []).length})</span>
              <span className="text-xs font-normal text-slate-400">Price Snapshotted</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    <th className="px-4 py-3">Product Name & Variant</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                  {(order.items ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">
                          {item.product_name || `Variant #${item.variant_id}`}
                        </p>
                        {item.variant_label && (
                          <p className="text-2xs text-indigo-600 dark:text-indigo-400 font-medium">
                            Option: {item.variant_label}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 dark:text-zinc-400 font-mono text-2xs">
                        {item.variant_sku || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-slate-700 dark:text-zinc-300">
                        ${Number(item.unit_selling_price || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-center font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white text-right text-sm">
                        ${Number(item.line_total || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3 max-w-md ml-auto">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 pb-2 border-b border-slate-200 dark:border-zinc-800">
              Financial Summary Breakdown
            </h2>

            <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                ${Number(order.total_amount || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Estimated Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>

            <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400">
              <span>Tax (Included)</span>
              <span className="font-semibold text-slate-900 dark:text-white">$0.00</span>
            </div>

            <div className="flex justify-between text-base font-bold border-t border-slate-200 dark:border-zinc-800 pt-3 text-slate-900 dark:text-white">
              <span>Grand Total</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-xl font-extrabold">
                ${Number(order.total_amount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (1/3) — Customer, Shipping & Tracking */}
        <div className="space-y-6">
          {/* Customer Details Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500" /> Customer Profile
            </h2>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {order.user_name || 'Guest / Anonymous'}
              </p>
              {order.user_email && (
                <a
                  href={`mailto:${order.user_email}`}
                  className="text-slate-500 dark:text-zinc-400 font-mono flex items-center gap-1.5 hover:text-indigo-600"
                >
                  <Mail className="w-3.5 h-3.5" /> {order.user_email}
                </a>
              )}

              {order.user_id && (
                <Link
                  to={`/customers/${order.user_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline pt-2"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Customer Account Details →
                </Link>
              )}
            </div>
          </div>

          {/* Shipping & Delivery Address Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" /> Shipping Address
              </h2>
              <button
                onClick={() => copyAddressToClipboard(addressText)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                title="Copy full address"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-xs text-slate-700 dark:text-zinc-300 leading-relaxed font-mono whitespace-pre-line">
              {addressText}
            </div>
          </div>

          {/* Tracking Info Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-500" /> Carrier Tracking
              </h2>
              <button
                onClick={() => setIsEditingTracking(!isEditingTracking)}
                className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" /> {isEditingTracking ? 'Done' : 'Edit'}
              </button>
            </div>

            {isEditingTracking ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Carrier Name"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="input text-xs"
                />
                <input
                  type="text"
                  placeholder="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="input text-xs"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">{carrier}</p>
                <p className="font-mono text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>{trackingNumber}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 cursor-pointer" />
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Update Order Status Modal */}
      {updateStatusOpen && (
        <Modal
          isOpen={true}
          onClose={() => setUpdateStatusOpen(false)}
          title={`Update Fulfillment — Order #${order.id}`}
          size="sm"
          footer={
            <>
              <button className="btn-secondary text-xs" onClick={() => setUpdateStatusOpen(false)}>
                Cancel
              </button>
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
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">
                Fulfillment Status *
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
          </form>
        </Modal>
      )}
    </div>
  );
}
