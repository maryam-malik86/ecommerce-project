import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { Edit2, Trash2, Layers, FolderTree, Plus, CheckSquare, Square, X } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  created_at: string;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

async function fetchCategories() {
  const { data } = await api.get('/catalog/categories');
  return data.data as Category[];
}

async function fetchCollections() {
  const { data } = await api.get('/catalog/collections');
  return data.data as Collection[];
}

const emptyCatForm = { name: '', slug: '', description: '', parent_id: '', collection_id: '' };
const emptyColForm = { name: '', slug: '', description: '' };

const toSlug = (str: string) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'categories' | 'collections'>('categories');
  const [search, setSearch] = useState('');

  // Multi-select State
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [selectedColIds, setSelectedColIds] = useState<number[]>([]);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState(emptyCatForm);

  // Collection Modal State
  const [colModalOpen, setColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Collection | null>(null);
  const [colForm, setColForm] = useState(emptyColForm);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'collection'; ids: number[] } | null>(null);

  // Queries
  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: collections, isLoading: loadingCols } = useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  });

  // Category Mutations
  const createCatMutation = useMutation({
    mutationFn: (body: object) => api.post('/catalog/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setCatModalOpen(false);
      toast.success('Category created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create category');
    },
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.patch(`/catalog/categories/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setCatModalOpen(false);
      toast.success('Category updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update category');
    },
  });

  const deleteCatsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await api.delete(`/catalog/categories/${id}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setDeleteTarget(null);
      setSelectedCatIds([]);
      toast.success('Category(ies) deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete categories');
    },
  });

  // Collection Mutations
  const createColMutation = useMutation({
    mutationFn: (body: object) => api.post('/catalog/collections', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      setColModalOpen(false);
      toast.success('Collection created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create collection');
    },
  });

  const updateColMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => api.patch(`/catalog/collections/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      setColModalOpen(false);
      toast.success('Collection updated successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update collection');
    },
  });

  const deleteColsMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await api.delete(`/catalog/collections/${id}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      setDeleteTarget(null);
      setSelectedColIds([]);
      toast.success('Collection(s) deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete collections');
    },
  });

  // Category Modal Openers
  const openCreateCat = () => {
    setEditingCat(null);
    setCatForm(emptyCatForm);
    setCatModalOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      collection_id: '',
    });
    setCatModalOpen(true);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: catForm.name,
      description: catForm.description || null,
      parent_id: catForm.parent_id ? Number(catForm.parent_id) : null,
    };
    if (editingCat) updateCatMutation.mutate({ id: editingCat.id, body });
    else createCatMutation.mutate(body);
  };

  // Collection Modal Openers
  const openCreateCol = () => {
    setEditingCol(null);
    setColForm(emptyColForm);
    setColModalOpen(true);
  };

  const openEditCol = (col: Collection) => {
    setEditingCol(col);
    setColForm({
      name: col.name,
      slug: col.slug,
      description: col.description ?? '',
    });
    setColModalOpen(true);
  };

  const handleColSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      name: colForm.name,
      description: colForm.description || null,
    };
    if (editingCol) updateColMutation.mutate({ id: editingCol.id, body });
    else createColMutation.mutate(body);
  };

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c.name]));

  const filteredCategories = (categories ?? []).filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCollections = (collections ?? []).filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Multi-select helpers
  const allCatsSelected = filteredCategories.length > 0 && filteredCategories.every((c) => selectedCatIds.includes(c.id));
  const toggleSelectAllCats = () => {
    if (allCatsSelected) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(filteredCategories.map((c) => c.id));
    }
  };

  const toggleSelectCat = (id: number) => {
    if (selectedCatIds.includes(id)) {
      setSelectedCatIds(selectedCatIds.filter((i) => i !== id));
    } else {
      setSelectedCatIds([...selectedCatIds, id]);
    }
  };

  const allColsSelected = filteredCollections.length > 0 && filteredCollections.every((col) => selectedColIds.includes(col.id));
  const toggleSelectAllCols = () => {
    if (allColsSelected) {
      setSelectedColIds([]);
    } else {
      setSelectedColIds(filteredCollections.map((col) => col.id));
    }
  };

  const toggleSelectCol = (id: number) => {
    if (selectedColIds.includes(id)) {
      setSelectedColIds(selectedColIds.filter((i) => i !== id));
    } else {
      setSelectedColIds([...selectedColIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Categories & Collections</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Organize products into hierarchical category trees and flat marketing collections.
          </p>
        </div>

        <button
          onClick={activeTab === 'categories' ? openCreateCat : openCreateCol}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto text-xs"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'categories' ? 'Add Category' : 'Add Collection'}
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            Categories Tree ({categories?.length ?? 0})
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`flex items-center gap-2 pb-3 px-1 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'collections'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Collections ({collections?.length ?? 0})
          </button>
        </div>
      </div>

      {/* Multi-select Action Bar */}
      {activeTab === 'categories' && selectedCatIds.length > 0 && (
        <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold">{selectedCatIds.length}</span>
            <span className="font-semibold text-cyan-900 dark:text-cyan-200">Categories selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteTarget({ type: 'category', ids: selectedCatIds })}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedCatIds.length})
            </button>
            <button
              onClick={() => setSelectedCatIds([])}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'collections' && selectedColIds.length > 0 && (
        <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold">{selectedColIds.length}</span>
            <span className="font-semibold text-cyan-900 dark:text-cyan-200">Collections selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDeleteTarget({ type: 'collection', ids: selectedColIds })}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedColIds.length})
            </button>
            <button
              onClick={() => setSelectedColIds([])}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-xs">
        <input
          type="text"
          placeholder={activeTab === 'categories' ? 'Search categories...' : 'Search collections...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        />
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        <>
          {loadingCats ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredCategories.length === 0 ? (
            <EmptyState title="No Categories" description="Create category nodes to organize your catalog." />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={allCatsSelected}
                        onChange={toggleSelectAllCats}
                        className="rounded border-slate-300 dark:border-zinc-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Parent Category</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredCategories.map((c) => {
                    const isSelected = selectedCatIds.includes(c.id);
                    return (
                      <tr key={c.id} className={`hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 ${isSelected ? 'bg-cyan-50/30 dark:bg-cyan-950/20' : ''}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCat(c.id)}
                            className="rounded border-slate-300 dark:border-zinc-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                          {c.parent_id ? `↳ ${c.name}` : c.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">{c.slug}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                          {c.parent_id ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {catMap[c.parent_id] || `ID ${c.parent_id}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-500 font-semibold text-2xs uppercase tracking-wider">Root Category</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditCat(c)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'category', ids: [c.id] })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </>
      )}

      {/* Collections View */}
      {activeTab === 'collections' && (
        <>
          {loadingCols ? (
            <TableSkeleton rows={5} cols={4} />
          ) : filteredCollections.length === 0 ? (
            <EmptyState title="No Collections" description="Create collections to organize marketing groupings." />
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={allColsSelected}
                        onChange={toggleSelectAllCols}
                        className="rounded border-slate-300 dark:border-zinc-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Collection Name</th>
                    <th className="py-3 px-4">Slug</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filteredCollections.map((col) => {
                    const isSelected = selectedColIds.includes(col.id);
                    return (
                      <tr key={col.id} className={`hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 ${isSelected ? 'bg-cyan-50/30 dark:bg-cyan-950/20' : ''}`}>
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCol(col.id)}
                            className="rounded border-slate-300 dark:border-zinc-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{col.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">{col.slug}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">{col.description || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditCol(col)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ type: 'collection', ids: [col.id] })}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
        </>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleCatSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input
              type="text"
              required
              value={catForm.name}
              onChange={(e) => {
                const val = e.target.value;
                setCatForm((prev) => ({ ...prev, name: val, slug: toSlug(val) }));
              }}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Parent Category (Optional)</label>
            <select
              value={catForm.parent_id}
              onChange={(e) => setCatForm((prev) => ({ ...prev, parent_id: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
            >
              <option value="">None (Top-Level Category)</option>
              {(categories ?? [])
                .filter((c) => !editingCat || c.id !== editingCat.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id ? `↳ ${c.name}` : c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Collection (Optional)</label>
            <select
              value={catForm.collection_id}
              onChange={(e) => setCatForm((prev) => ({ ...prev, collection_id: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
            >
              <option value="">None (All Collections)</option>
              {(collections ?? []).map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={catForm.description}
              onChange={(e) => setCatForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCatModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createCatMutation.isPending || updateCatMutation.isPending}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700"
            >
              {editingCat ? 'Update' : 'Create'} Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Collection Modal */}
      <Modal
        isOpen={colModalOpen}
        onClose={() => setColModalOpen(false)}
        title={editingCol ? 'Edit Collection' : 'Create Collection'}
      >
        <form onSubmit={handleColSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Name *</label>
            <input
              type="text"
              required
              value={colForm.name}
              onChange={(e) => setColForm((prev) => ({ ...prev, name: e.target.value, slug: toSlug(e.target.value) }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={colForm.description}
              onChange={(e) => setColForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setColModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createColMutation.isPending || updateColMutation.isPending}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700"
            >
              {editingCol ? 'Update' : 'Create'} Collection
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.type === 'category' ? 'Category' : 'Collection'}${deleteTarget?.ids && deleteTarget.ids.length > 1 ? 's' : ''}`}
      >
        <div className="space-y-4 text-xs">
          <p>
            Are you sure you want to delete {deleteTarget?.ids?.length ?? 1} {deleteTarget?.type}(s)? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleteCatsMutation.isPending || deleteColsMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                if (deleteTarget.type === 'category') deleteCatsMutation.mutate(deleteTarget.ids);
                else deleteColsMutation.mutate(deleteTarget.ids);
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700"
            >
              {deleteCatsMutation.isPending || deleteColsMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
