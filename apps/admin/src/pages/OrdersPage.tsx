import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { OrderStatusBadge, PaymentBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

interface Order {
  id: number;
  status: string;
  payment_status: string;
  total_amount: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  shipping_address: any;
  notes?: string;
  items?: Array<{
    id: number; variant_id: number; quantity: number;
    unit_selling_price: string; line_total: string;
    product_name?: string; variant_label?: string;
  }>;
}

interface Product {
  id: number; name: string;
  variants?: Array<{ id: number; option_label: string; selling_price: string; stock_quantity: number }>;
}

const ORDER_STATUSES = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];

async function fetchOrders(status: string, search: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const { data } = await api.get(`/orders?${params}`);
  let orders = data.data as Order[];
  if (search) orders = orders.filter((o) =>
    String(o.id).includes(search) ||
    (o.user_email ?? '').toLowerCase().includes(search.toLowerCase())
  );
  return orders;
}

async function fetchProducts() {
  const { data } = await api.get('/catalog/products?limit=100');
  return data.data as Product[];
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [updateOrder, setUpdateOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState('');

  // Create Order Modal State
  const [createOpen, setCreateOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    variant_id: '',
    quantity: 1,
    shipping_street: '',
    shipping_city: '',
    shipping_country: 'US',
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter, search],
    queryFn: () => fetchOrders(statusFilter, search),
  });

  const { data: products } = useQuery({
    queryKey: ['products-for-orders'],
    queryFn: fetchProducts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setUpdateOrder(null);
      toast.success('Order status updated');
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

  const createOrderMutation = useMutation({
    mutationFn: (body: object) => api.post('/orders', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setCreateOpen(false);
      toast.success('Manual order created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create order');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate({
      items: [{ variant_id: Number(orderForm.variant_id), quantity: Number(orderForm.quantity) }],
      shipping_address: {
        street: orderForm.shipping_street,
        city: orderForm.shipping_city,
        country: orderForm.shipping_country,
      },
    });
  };

  const openUpdate = (order: Order) => {
    setUpdateOrder(order);
    setNewStatus(order.status);
  };

  // Flatten all variants from available products
  const allVariants = (products ?? []).flatMap((p) =>
    (p.variants ?? []).map((v) => ({ ...v, product_name: p.name }))
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Orders Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            Track sales, process customer orders, and issue status updates
          </p>
        </div>
        <button id="create-order-btn" onClick={() => setCreateOpen(true)} className="btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Manual Order
        </button>
      </div>

      {/* Summary badges */}
      {!isLoading && orders && (
        <div className="flex flex-wrap gap-2">
          {['pending','confirmed','processing','shipped','delivered','cancelled'].map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                className={`badge cursor-pointer transition-all ${statusFilter === s ? 'ring-2 ring-purple-500' : ''}`}
              >
                <OrderStatusBadge status={s} />
                <span className="ml-1 font-medium" style={{ color: 'var(--ui-fg-muted)' }}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-fg-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="order-search"
            className="input pl-9"
            placeholder="Search by order ID or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="order-status-filter"
          className="select w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : !orders?.length ? (
          <EmptyState
            title="No orders found"
            description="Create a manual order or wait for storefront purchases."
            action={<button onClick={() => setCreateOpen(true)} className="btn-primary">Create Manual Order</button>}
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--ui-fg-muted)' }}>
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
              </svg>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <button
                        className="font-semibold hover:underline"
                        style={{ color: 'var(--ui-accent)' }}
                        onClick={() => setViewOrder(order)}
                      >
                        #{order.id}
                      </button>
                    </td>
                    <td>
                      <div style={{ color: 'var(--ui-fg-base)' }}>{order.user_name || 'Customer'}</div>
                      <div className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>{order.user_email}</div>
                    </td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td><PaymentBadge status={order.payment_status} /></td>
                    <td className="font-semibold">${Number(order.total_amount).toFixed(2)}</td>
                    <td style={{ color: 'var(--ui-fg-muted)' }}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setViewOrder(order)}
                          className="btn-ghost w-7 h-7 p-0 rounded"
                          title="View Invoice & Details"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => openUpdate(order)}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => setDeleteId(order.id)}
                          className="btn-ghost w-7 h-7 p-0 rounded"
                          title="Delete Order"
                          style={{ color: 'var(--ui-fg-error)' }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14H6L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Manual Order"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button
              id="submit-create-order"
              form="create-order-form"
              type="submit"
              className="btn-primary"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Creating…' : 'Place Order'}
            </button>
          </>
        }
      >
        <form id="create-order-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Select Product Variant *</label>
            <select
              className="select"
              required
              value={orderForm.variant_id}
              onChange={(e) => setOrderForm({ ...orderForm, variant_id: e.target.value })}
            >
              <option value="">Select item to order…</option>
              {allVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.product_name} — {v.option_label} (${v.selling_price}) [{v.stock_quantity} in stock]
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Quantity *</label>
            <input
              className="input"
              type="number"
              min="1"
              required
              value={orderForm.quantity}
              onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) })}
            />
          </div>
          <div className="border-t pt-3" style={{ borderColor: 'var(--ui-border-base)' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--ui-fg-muted)' }}>
              Shipping Address
            </p>
            <div className="space-y-2">
              <input
                className="input"
                required
                placeholder="Street Address (e.g. 123 Main St)"
                value={orderForm.shipping_street}
                onChange={(e) => setOrderForm({ ...orderForm, shipping_street: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  required
                  placeholder="City (e.g. New York)"
                  value={orderForm.shipping_city}
                  onChange={(e) => setOrderForm({ ...orderForm, shipping_city: e.target.value })}
                />
                <input
                  className="input"
                  required
                  placeholder="Country Code (e.g. US)"
                  value={orderForm.shipping_country}
                  onChange={(e) => setOrderForm({ ...orderForm, shipping_country: e.target.value })}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Order Detail Modal */}
      <Modal
        isOpen={viewOrder !== null}
        onClose={() => setViewOrder(null)}
        title={`Order Invoice #${viewOrder?.id}`}
        size="lg"
        footer={<button className="btn-secondary" onClick={() => setViewOrder(null)}>Close</button>}
      >
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-muted)' }}>STATUS</p>
                <OrderStatusBadge status={viewOrder.status} />
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-muted)' }}>PAYMENT</p>
                <PaymentBadge status={viewOrder.payment_status} />
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-muted)' }}>CUSTOMER</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--ui-fg-base)' }}>{viewOrder.user_name || 'Customer'}</p>
                <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>{viewOrder.user_email}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-muted)' }}>DATE</p>
                <p className="text-sm" style={{ color: 'var(--ui-fg-base)' }}>
                  {new Date(viewOrder.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            {viewOrder.shipping_address && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-muted)' }}>SHIPPING ADDRESS</p>
                <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--ui-bg-subtle)' }}>
                  {typeof viewOrder.shipping_address === 'string'
                    ? viewOrder.shipping_address
                    : JSON.stringify(viewOrder.shipping_address, null, 2)}
                </div>
              </div>
            )}

            <div className="border-t pt-3" style={{ borderColor: 'var(--ui-border-base)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ui-fg-muted)' }}>ORDER ITEMS</p>
              {viewOrder.items?.length ? (
                <div className="space-y-2">
                  {viewOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0"
                         style={{ borderColor: 'var(--ui-border-base)' }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--ui-fg-base)' }}>
                          {item.product_name ?? `Variant #${item.variant_id}`}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>
                          {item.variant_label} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-sm">${Number(item.line_total).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--ui-fg-muted)' }}>No items</p>
              )}
            </div>

            <div className="flex justify-between text-base font-bold border-t pt-3" style={{ borderColor: 'var(--ui-border-base)' }}>
              <span style={{ color: 'var(--ui-fg-subtle)' }}>Total</span>
              <span style={{ color: 'var(--ui-accent)' }}>${Number(viewOrder.total_amount).toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={updateOrder !== null}
        onClose={() => setUpdateOrder(null)}
        title={`Update Status — Order #${updateOrder?.id}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setUpdateOrder(null)}>Cancel</button>
            <button
              id="status-update-save"
              className="btn-primary"
              disabled={updateMutation.isPending || newStatus === updateOrder?.status}
              onClick={() => updateOrder && updateMutation.mutate({ id: updateOrder.id, status: newStatus })}
            >
              {updateMutation.isPending ? 'Updating…' : 'Update Status'}
            </button>
          </>
        }
      >
        {updateOrder && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>Current:</span>
              <OrderStatusBadge status={updateOrder.status} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ui-fg-subtle)' }}>
                New Status
              </label>
              <select
                id="new-order-status"
                className="select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Order"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
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
        <p className="text-sm" style={{ color: 'var(--ui-fg-subtle)' }}>
          Are you sure you want to delete order #{deleteId}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
