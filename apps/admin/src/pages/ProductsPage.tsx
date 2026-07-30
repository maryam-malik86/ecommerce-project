import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { ProductStatusBadge } from '../components/ui/Badge';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Edit2, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  status: 'active' | 'inactive' | 'archived';
  category_id: number;
  category_name?: string;
  created_at: string;
  variants?: Array<{
    id: number; sku: string; option_label: string;
    selling_price: string; cost_price: string; stock_quantity: number;
  }>;
}

interface Category { id: number; name: string; }

async function fetchProducts(search: string, status: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);
  const { data } = await api.get(`/catalog/products?${params}`);
  return data.data as Product[];
}
async function fetchCategories() {
  const { data } = await api.get('/catalog/categories');
  return data.data as Category[];
}

const emptyForm = {
  name: '', description: '', status: 'active' as 'active' | 'inactive' | 'archived',
  category_id: '', variant_sku: '', variant_label: '',
  cost_price: '', selling_price: '', stock_quantity: '0',
};

export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search, statusFilter],
    queryFn: () => fetchProducts(search, statusFilter),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/catalog/products', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
      toast.success('Product created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create product');
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.patch(`/catalog/products/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
      toast.success('Product updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update product');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/catalog/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setDeleteId(null);
      toast.success('Product deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    const v = p.variants?.[0];
    setForm({
      name: p.name, description: p.description ?? '', status: p.status,
      category_id: String(p.category_id),
      variant_sku: v?.sku ?? '', variant_label: v?.option_label ?? '',
      cost_price: v?.cost_price ?? '', selling_price: v?.selling_price ?? '',
      stock_quantity: String(v?.stock_quantity ?? 0),
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const firstVariant = editing?.variants?.[0];
    const body = {
      name: form.name, description: form.description, status: form.status,
      category_id: Number(form.category_id),
      variants: [{
        ...(firstVariant?.id && { id: firstVariant.id }),
        sku: form.variant_sku, option_label: form.variant_label,
        cost_price: Number(form.cost_price),
        selling_price: Number(form.selling_price),
        stock_quantity: Number(form.stock_quantity),
      }],
    };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Products</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            {products?.length ?? 0} products in catalog
          </p>
        </div>
        <button id="create-product-btn" onClick={openCreate} className="btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Product
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-fg-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="product-search"
            className="input pl-9"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          id="product-status-filter"
          className="select w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : !products?.length ? (
          <EmptyState
            title="No products found"
            description="Create your first product to get started."
            action={<button onClick={openCreate} className="btn-primary">New Product</button>}
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--ui-fg-muted)' }}>
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              </svg>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Variants</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const v = p.variants?.[0];
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="font-medium" style={{ color: 'var(--ui-fg-base)' }}>{p.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>{p.slug}</div>
                      </td>
                      <td style={{ color: 'var(--ui-fg-subtle)' }}>{catMap[p.category_id] ?? '—'}</td>
                      <td><ProductStatusBadge status={p.status} /></td>
                      <td style={{ color: 'var(--ui-fg-subtle)' }}>{p.variants?.length ?? 0}</td>
                      <td className="font-medium">
                        {v ? `$${Number(v.selling_price).toFixed(2)}` : '—'}
                      </td>
                      <td>
                        {v ? (
                          <span className={`font-medium ${v.stock_quantity === 0 ? 'text-red-500' : v.stock_quantity <= 5 ? 'text-amber-500' : ''}`}
                                style={v.stock_quantity > 5 ? { color: 'var(--ui-fg-base)' } : {}}>
                            {v.stock_quantity}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--ui-fg-muted)' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(p)}
                            className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                            title="Edit"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Create Product'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              id="product-save-btn"
              form="product-form"
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Product Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Premium Wireless Headphones" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Category *</label>
              <select className="select" required value={form.category_id} onChange={(e) => setForm({...form, category_id: e.target.value})}>
                <option value="">Select category</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Status</label>
              <select className="select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value as any})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Description</label>
              <textarea className="textarea" rows={3} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Product description…" />
            </div>
          </div>

          <div className="border-t pt-4" style={{ borderColor: 'var(--ui-border-base)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--ui-fg-muted)' }}>VARIANT DETAILS</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>SKU *</label>
                <input className="input" required value={form.variant_sku} onChange={(e) => setForm({...form, variant_sku: e.target.value})} placeholder="SKU-001" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Option Label *</label>
                <input className="input" required value={form.variant_label} onChange={(e) => setForm({...form, variant_label: e.target.value})} placeholder="Default / One Size" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Cost Price ($) *</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.cost_price} onChange={(e) => setForm({...form, cost_price: e.target.value})} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Selling Price ($) *</label>
                <input className="input" type="number" step="0.01" min="0" required value={form.selling_price} onChange={(e) => setForm({...form, selling_price: e.target.value})} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Initial Stock</label>
                <input className="input" type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({...form, stock_quantity: e.target.value})} />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Product"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm" style={{ color: 'var(--ui-fg-subtle)' }}>
          Are you sure you want to delete this product? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
