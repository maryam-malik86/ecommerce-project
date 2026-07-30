import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Edit2, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  created_at: string;
}

async function fetchCategories() {
  const { data } = await api.get('/catalog/categories');
  return data.data as Category[];
}

const emptyForm = { name: '', slug: '', description: '', parent_id: '' };

const toSlug = (str: string) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => api.post('/catalog/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
      toast.success('Category created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create category');
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.patch(`/catalog/categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
      toast.success('Category updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update category');
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/catalog/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDeleteId(null);
      toast.success('Category deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
    });
    setAutoSlug(false);
    setModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: autoSlug ? toSlug(val) : prev.slug,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: form.name,
      description: form.description || null,
      parent_id: form.parent_id ? Number(form.parent_id) : null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, body });
    else createMutation.mutate(body);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));
  const filtered = (categories ?? []).filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Categories</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            Organize catalog products into hierarchy and collections
          </p>
        </div>
        <button id="create-category-btn" onClick={openCreate} className="btn-primary">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="card p-3">
        <div className="relative">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-fg-muted)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="category-search"
            className="input pl-9"
            placeholder="Search categories by name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : !filtered.length ? (
          <EmptyState
            title="No categories found"
            description="Create catalog categories to group products."
            action={<button onClick={openCreate} className="btn-primary">New Category</button>}
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--ui-fg-muted)' }}>
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            }
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Parent Category</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id}>
                    <td className="font-semibold" style={{ color: 'var(--ui-fg-base)' }}>{cat.name}</td>
                    <td>
                      <code className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--ui-bg-component)', color: 'var(--ui-accent)' }}>
                        /{cat.slug}
                      </code>
                    </td>
                    <td>
                      {cat.parent_id ? (
                        <span className="badge badge-purple">{catMap[cat.parent_id] ?? `Category #${cat.parent_id}`}</span>
                      ) : (
                        <span className="badge badge-neutral">Top Level</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--ui-fg-muted)' }} className="max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td style={{ color: 'var(--ui-fg-muted)' }}>
                      {new Date(cat.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(cat)}
                          className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                          title="Edit Category"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="btn-ghost w-7 h-7 p-0 rounded flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Category"
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Category' : 'Create Category'}
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              id="category-save-btn"
              form="category-form"
              type="submit"
              className="btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Create Category'}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Category Name *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Smart Watches"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>URL Slug *</label>
            <input
              className="input"
              required
              value={form.slug}
              onChange={(e) => { setForm({ ...form, slug: e.target.value }); setAutoSlug(false); }}
              placeholder="smart-watches"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Parent Category (optional)</label>
            <select
              className="select"
              value={form.parent_id}
              onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            >
              <option value="">None (Top Level Category)</option>
              {(categories ?? [])
                .filter((c) => !editing || c.id !== editing.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Category overview and details…"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Delete Category"
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
          Are you sure you want to delete this category? Products in this category will become uncategorized.
        </p>
      </Modal>
    </div>
  );
}
