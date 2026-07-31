import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { ArrowLeft, Tag, Palette, DollarSign, Package, Calendar } from 'lucide-react';

async function fetchProductById(id: string) {
  const { data } = await api.get(`/catalog/products/${id}`);
  return data.data;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: item, isLoading, isError } = useQuery({
    queryKey: ['product-detail', id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse" />
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="space-y-4">
        <Link to="/products" className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Items Directory
        </Link>
        <EmptyState title="Item not found" description="The requested item details could not be retrieved." />
      </div>
    );
  }

  const margin = item.proposed_retail && item.variants?.[0]?.cost_price
    ? (((item.proposed_retail - item.variants[0].cost_price) / item.proposed_retail) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link to="/products" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:text-cyan-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Items Directory
        </Link>
        <span className="text-2xs font-mono text-slate-400 dark:text-zinc-500">
          BA REF: {item.ba_ref || `BA-${item.id}`}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row gap-6">
        {/* Main Photo */}
        <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-zinc-800 flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No photo</div>
          )}
        </div>

        {/* Item Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{item.name}</h1>
            <span className="px-2.5 py-1 rounded-full text-2xs font-semibold uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              {item.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-zinc-400">
            {item.supplier && (
              <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-zinc-200">
                <span>{item.supplier.country_flag}</span> Supplier: {item.supplier.name} ({item.supplier_ref || 'N/A'})
              </span>
            )}
            {item.brand && <span>Brand: <strong>{item.brand}</strong></span>}
            {item.department && <span>Dept: <strong>{item.department}</strong></span>}
            {item.season && <span>Season: <strong>{item.season}</strong></span>}
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            {item.description || 'Enterprise catalog item.'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Proposed Retail Price</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            ${Number(item.proposed_retail || item.variants?.[0]?.selling_price || 0).toFixed(2)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Supplier Cost Price</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            ${Number(item.variants?.[0]?.cost_price || 0).toFixed(2)}
          </p>
          <p className="text-2xs text-slate-400 mt-1">Est. Gross Margin: {margin}%</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">Proposed Stock Qty</p>
          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">
            {item.proposed_qty || item.variants?.[0]?.stock_quantity || 0} units
          </p>
        </div>
      </div>

      {/* Colors & Materials Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
            <Palette className="w-4 h-4 text-cyan-500" /> Colour Swatches
          </h2>
          <div className="flex flex-wrap gap-2">
            {item.colors && item.colors.length > 0 ? (
              item.colors.map((c: any, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: c.hex }} />
                  {c.name}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No color swatches defined.</p>
            )}
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-500" /> Construction Materials
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {item.materials && item.materials.length > 0 ? (
              item.materials.map((m: string, idx: number) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                  {m}
                </span>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No construction materials listed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
