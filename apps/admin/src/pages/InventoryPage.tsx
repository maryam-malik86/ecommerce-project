import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Edit2, Trash2 } from 'lucide-react';

interface LowStockAlert {
  variant_id: number; sku: string; option_label: string;
  product_name: string; stock_quantity: number; low_stock_threshold: number;
}

interface Supplier {
  id: number; name: string; contact_email: string | null;
  contact_phone: string | null; address: string | null; created_at: string;
}

async function fetchLowStock() {
  const { data } = await api.get('/inventory/low-stock');
  return data.data as LowStockAlert[];
}

async function fetchSuppliers() {
  const { data } = await api.get('/inventory/suppliers');
  return data.data as Supplier[];
}

const emptySupplierForm = { name: '', contact_email: '', contact_phone: '', address: '' };

export default function InventoryPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'stock' | 'suppliers'>('stock');
  const [search, setSearch] = useState('');

  // Stock Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<LowStockAlert | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustType, setAdjustType] = useState<'purchase' | 'adjustment' | 'return' | 'loss'>('purchase');
  const [supplierId, setSupplierId] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  // Supplier Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [deleteSupplierId, setDeleteSupplierId] = useState<number | null>(null);

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['low-stock'],
    queryFn: fetchLowStock,
  });

  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });

  const recordMovementMutation = useMutation({
    mutationFn: (body: object) => api.post('/inventory/movements', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setAdjustItem(null);
      toast.success('Inventory movement recorded successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to record movement');
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: (body: object) => api.post('/inventory/suppliers', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setSupplierModalOpen(false);
      toast.success('Supplier added successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add supplier');
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.put(`/inventory/suppliers/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setSupplierModalOpen(false);
      toast.success('Supplier updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update supplier');
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/inventory/suppliers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      setDeleteSupplierId(null);
      toast.success('Supplier deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete supplier');
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    recordMovementMutation.mutate({
      variant_id: adjustItem.variant_id,
      quantity: Number(adjustQty),
      type: adjustType,
      supplier_id: supplierId ? Number(supplierId) : null,
      note: adjustNote || `Manual ${adjustType} stock adjustment`,
    });
  };

  const openCreateSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplierForm);
    setSupplierModalOpen(true);
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      name: s.name,
      contact_email: s.contact_email ?? '',
      contact_phone: s.contact_phone ?? '',
      address: s.address ?? '',
    });
    setSupplierModalOpen(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, body: supplierForm });
    } else {
      createSupplierMutation.mutate(supplierForm);
    }
  };

  const filteredAlerts = (alerts ?? []).filter((a) =>
    !search ||
    a.product_name.toLowerCase().includes(search.toLowerCase()) ||
    a.sku.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSuppliers = (suppliers ?? []).filter((s) =>
    !search ||
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Inventory & Suppliers</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            Monitor low-stock items, log stock restocks, and manage vendor relationships
          </p>
        </div>
        {activeTab === 'suppliers' && (
          <button id="add-supplier-btn" onClick={openCreateSupplier} className="btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Vendor / Supplier
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--ui-border-base)' }}>
        <button
          id="tab-stock-alerts"
          onClick={() => setActiveTab('stock')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2"
          style={{
            borderColor: activeTab === 'stock' ? 'var(--ui-accent)' : 'transparent',
            color: activeTab === 'stock' ? 'var(--ui-accent)' : 'var(--ui-fg-muted)',
          }}
        >
          <span>Stock Levels & Alerts</span>
          {alerts && alerts.length > 0 && (
            <span className="badge badge-amber">{alerts.length} Low Stock</span>
          )}
        </button>
        <button
          id="tab-suppliers-directory"
          onClick={() => setActiveTab('suppliers')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-2"
          style={{
            borderColor: activeTab === 'suppliers' ? 'var(--ui-accent)' : 'transparent',
            color: activeTab === 'suppliers' ? 'var(--ui-accent)' : 'var(--ui-fg-muted)',
          }}
        >
          <span>Suppliers Directory</span>
          <span className="badge badge-neutral">{suppliers?.length ?? 0}</span>
        </button>
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-fg-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="inventory-search"
            className="input pl-9"
            placeholder={activeTab === 'stock' ? "Search low stock items by SKU or product name…" : "Search suppliers by name or email…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tab 1: Stock Levels */}
      {activeTab === 'stock' && (
        <div className="card overflow-hidden">
          {loadingAlerts ? (
            <TableSkeleton rows={5} cols={6} />
          ) : !filteredAlerts.length ? (
            <EmptyState
              title="All stock levels healthy!"
              description="No products are currently at or below low stock thresholds."
              icon={
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#16a34a' }}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              }
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Option</th>
                    <th>Current Stock</th>
                    <th>Threshold</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((item) => (
                    <tr key={item.variant_id}>
                      <td className="font-semibold" style={{ color: 'var(--ui-fg-base)' }}>{item.product_name}</td>
                      <td>
                        <code className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--ui-bg-subtle)' }}>
                          {item.sku}
                        </code>
                      </td>
                      <td style={{ color: 'var(--ui-fg-subtle)' }}>{item.option_label}</td>
                      <td>
                        <span className={`font-bold ${item.stock_quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.stock_quantity === 0 ? 'Out of Stock (0)' : `${item.stock_quantity} remaining`}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ui-fg-muted)' }}>{item.low_stock_threshold}</td>
                      <td>
                        <button
                          onClick={() => { setAdjustItem(item); setAdjustQty(20); }}
                          className="btn-primary text-xs py-1 px-3"
                        >
                          + Restock Item
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="card overflow-hidden">
          {loadingSuppliers ? (
            <TableSkeleton rows={5} cols={5} />
          ) : !filteredSuppliers.length ? (
            <EmptyState
              title="No suppliers registered"
              description="Add vendors to track stock replenishment orders."
              action={<button onClick={openCreateSupplier} className="btn-primary">Add Supplier</button>}
              icon={
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--ui-fg-muted)' }}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
              }
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Registered</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((sup) => (
                    <tr key={sup.id}>
                      <td className="font-semibold" style={{ color: 'var(--ui-fg-base)' }}>{sup.name}</td>
                      <td style={{ color: 'var(--ui-fg-subtle)' }}>{sup.contact_email || '—'}</td>
                      <td style={{ color: 'var(--ui-fg-subtle)' }}>{sup.contact_phone || '—'}</td>
                      <td style={{ color: 'var(--ui-fg-muted)' }} className="max-w-xs truncate">{sup.address || '—'}</td>
                      <td style={{ color: 'var(--ui-fg-muted)' }}>{new Date(sup.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEditSupplier(sup)}
                            className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Edit Supplier"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteSupplierId(sup.id)}
                            className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Supplier"
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
      )}

      {/* Restock Stock Adjustment Modal */}
      <Modal
        isOpen={adjustItem !== null}
        onClose={() => setAdjustItem(null)}
        title={`Restock Stock — ${adjustItem?.product_name}`}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAdjustItem(null)}>Cancel</button>
            <button
              id="submit-restock-btn"
              form="restock-form"
              type="submit"
              className="btn-primary"
              disabled={recordMovementMutation.isPending}
            >
              {recordMovementMutation.isPending ? 'Saving…' : 'Record Restock'}
            </button>
          </>
        }
      >
        <form id="restock-form" onSubmit={handleAdjustSubmit} className="space-y-4">
          <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'var(--ui-bg-subtle)' }}>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--ui-fg-muted)' }}>SKU & OPTION</p>
              <p className="text-sm font-bold" style={{ color: 'var(--ui-fg-base)' }}>{adjustItem?.sku} — {adjustItem?.option_label}</p>
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--ui-fg-muted)' }}>CURRENT STOCK</p>
              <p className="text-sm font-bold text-amber-600">{adjustItem?.stock_quantity} units</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Movement Type *</label>
              <select className="select" value={adjustType} onChange={(e) => setAdjustType(e.target.value as any)}>
                <option value="purchase">Purchase / Supplier Inbound (+)</option>
                <option value="adjustment">Stock Audit Adjustment (+)</option>
                <option value="return">Customer Return (+)</option>
                <option value="loss">Damaged / Lost (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Quantity *</label>
              <input
                className="input"
                type="number"
                min="1"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Supplier / Vendor (optional)</label>
            <select className="select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">None / Internal Restock</option>
              {(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Note / Reference</label>
            <input
              className="input"
              placeholder="e.g. Inbound PO #98432"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
            />
          </div>
        </form>
      </Modal>

      {/* Create / Edit Supplier Modal */}
      <Modal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        title={editingSupplier ? 'Edit Supplier' : 'Add Vendor / Supplier'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSupplierModalOpen(false)}>Cancel</button>
            <button
              id="supplier-save-btn"
              form="supplier-form"
              type="submit"
              className="btn-primary"
              disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
            >
              {createSupplierMutation.isPending || updateSupplierMutation.isPending ? 'Saving…' : editingSupplier ? 'Save Changes' : 'Create Supplier'}
            </button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSupplierSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Company / Vendor Name *</label>
            <input
              className="input"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              placeholder="e.g. Acme Electronics Ltd."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Contact Email</label>
              <input
                className="input"
                type="email"
                value={supplierForm.contact_email}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_email: e.target.value })}
                placeholder="orders@acme.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Contact Phone</label>
              <input
                className="input"
                value={supplierForm.contact_phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, contact_phone: e.target.value })}
                placeholder="+1 (555) 019-2834"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Physical Address</label>
            <textarea
              className="textarea"
              rows={2}
              value={supplierForm.address}
              onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              placeholder="Full warehouse address…"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Supplier Modal */}
      <Modal
        isOpen={deleteSupplierId !== null}
        onClose={() => setDeleteSupplierId(null)}
        title="Delete Supplier"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteSupplierId(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => deleteSupplierId && deleteSupplierMutation.mutate(deleteSupplierId)}
              disabled={deleteSupplierMutation.isPending}
            >
              {deleteSupplierMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ui-fg-subtle)' }}>
          Are you sure you want to delete this supplier?
        </p>
      </Modal>
    </div>
  );
}
