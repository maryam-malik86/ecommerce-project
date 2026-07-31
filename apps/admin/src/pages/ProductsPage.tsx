import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { toast } from 'sonner';
import {
  Search, Plus, Upload, Columns, Filter, Eye, Edit2, Trash2, Tag, Palette, CheckSquare
} from 'lucide-react';

interface ColorSwatch {
  name: string;
  hex: string;
}

interface Item {
  id: number;
  name: string;
  category_name?: string;
  supplier_ref?: string;
  our_ref?: string;
  ba_ref?: string;
  brand?: string;
  season?: string;
  department?: string;
  colors?: ColorSwatch[];
  materials?: string[];
  proposed_retail?: number;
  proposed_qty?: number;
  image_url?: string;
  photos?: string[];
  status: string;
  supplier?: {
    id: number;
    name: string;
    country_code?: string;
    country_flag?: string;
  };
}

async function fetchProducts(search = '', showArchived = false) {
  const params = new URLSearchParams();
  params.set('limit', '100');
  if (search) params.set('search', search);
  if (showArchived) params.set('status', 'archived');
  const { data } = await api.get(`/catalog/products?${params.toString()}`);
  return data.data as Item[];
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Queries
  const { data: items, isLoading } = useQuery({
    queryKey: ['products', search, showArchived],
    queryFn: () => fetchProducts(search, showArchived),
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/catalog/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('Item deleted or archived');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete item');
    },
  });

  const toggleSelectAll = () => {
    if (!items) return;
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((i) => i.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredItems = items ?? [];

  return (
    <div className="space-y-6">
      {/* Header matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Items</h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Organize and manage items, including categories, pricing, colors, materials, and seasonal information.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${showArchived ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-300 dark:border-amber-800' : 'bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700'}`}
          >
            Archived
          </button>

          <button className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 shadow-sm">
            <Upload className="w-3.5 h-3.5" /> Import items
          </button>

          <Link
            to="/products/new"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus className="w-4 h-4" /> Add New Item
          </Link>
        </div>
      </div>

      {/* Toolbar Controls matching Image 1 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name, ref, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          <select className="py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white">
            <option>No Grouping</option>
            <option>Group by Supplier</option>
            <option>Group by Department</option>
            <option>Group by Brand</option>
          </select>

          <button className="py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Columns className="w-3.5 h-3.5" /> Columns
          </button>
        </div>
      </div>

      {/* Data Table matching Image 1 */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          title="No items found"
          description={search ? `No items match "${search}"` : 'Your item directory is empty. Add a new item to get started.'}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                  <th className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="px-3 py-3">IMAGE</th>
                  <th className="px-4 py-3">SUPPLIER REF</th>
                  <th className="px-4 py-3">SUPPLIER</th>
                  <th className="px-4 py-3">COLOURS</th>
                  <th className="px-4 py-3">MATERIALS</th>
                  <th className="px-4 py-3">PROPOSED RETAIL</th>
                  <th className="px-4 py-3">BRAND</th>
                  <th className="px-4 py-3">PROPOSED QTY</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/products/${item.id}`)}
                    className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                    </td>

                    {/* Image Thumbnail */}
                    <td className="px-3 py-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-2xs text-slate-400 font-mono">No IMG</div>
                        )}
                      </div>
                    </td>

                    {/* Supplier Ref */}
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white font-mono">
                      {item.supplier_ref || '—'}
                    </td>

                    {/* Supplier + Country Flag badge matching Image 1 */}
                    <td className="px-4 py-3">
                      {item.supplier ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-800 dark:text-zinc-200 font-medium">
                          <span className="text-sm">{item.supplier.country_flag || '🇺🇸'}</span>
                          {item.supplier.name}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Colors Swatches (Color dots) matching Image 1 */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {item.colors && item.colors.length > 0 ? (
                          item.colors.slice(0, 5).map((c, idx) => (
                            <span
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs inline-block"
                              style={{ backgroundColor: c.hex }}
                              title={c.name}
                            />
                          ))
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </div>
                    </td>

                    {/* Materials Pills matching Image 1 */}
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-zinc-400">
                      {item.materials && item.materials.length > 0 ? (
                        item.materials.join(', ')
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Proposed Retail Price */}
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      ${Number(item.proposed_retail || 0).toFixed(2)}
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-3 text-slate-600 dark:text-zinc-300">
                      {item.brand || '—'}
                    </td>

                    {/* Proposed Qty */}
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-zinc-300">
                      {item.proposed_qty !== null && item.proposed_qty !== undefined ? item.proposed_qty : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/products/${item.id}`)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Inspect Item"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-600" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer pagination info */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800 text-2xs text-slate-400 dark:text-zinc-500 flex items-center justify-between">
            <span>Showing {filteredItems.length} items</span>
            <span>{selectedIds.length} selected</span>
          </div>
        </div>
      )}
    </div>
  );
}
