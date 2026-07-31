import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, Plus, Trash2, Tag, Palette, ShieldCheck, CheckCircle2
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  country_code?: string;
  country_flag?: string;
}

interface ColorSwatch {
  name: string;
  hex: string;
}

const PRESET_COLORS = [
  { name: 'Navy Blue', hex: '#1e3a8a' },
  { name: 'Blue', hex: '#2563eb' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'Olive', hex: '#65a30d' },
  { name: 'Gold', hex: '#eab308' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Tan', hex: '#d97706' },
  { name: 'Black', hex: '#000000' },
  { name: 'Dark Navy', hex: '#1e1b4b' },
];

const PRESET_MATERIALS = [
  'Polycarbonate', 'Polyester Fabric', 'Rubber Wheels', 'Canvas Fabric',
  'Mesh Fabric', 'Steel Zipper', 'Aluminum Frame', 'TSA Lock'
];

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get('/catalog/suppliers');
  return data.data as Supplier[];
}

async function fetchCategories() {
  const { data } = await api.get('/catalog/categories');
  return data.data as any[];
}

export default function CreateProductPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Form State matching Image 2
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1565026057447-b88e3f29042b?w=600&auto=format&fit=crop&q=80'
  ]);
  const [photoInput, setPhotoInput] = useState('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierRef, setSupplierRef] = useState('');
  const [ourRef, setOurRef] = useState('');
  const [baRef, setBaRef] = useState(`BA-${Math.floor(1000 + Math.random() * 9000)}`);

  const [name, setName] = useState('');
  const [season, setSeason] = useState('Eco Travel Collection (SEA010)');
  const [department, setDepartment] = useState('Travel & Luggage');
  const [brand, setBrand] = useState('ExploreHub');
  const [categoryId, setCategoryId] = useState<string>('1');

  const [selectedColors, setSelectedColors] = useState<ColorSwatch[]>([
    { name: 'Navy Blue', hex: '#1e3a8a' },
    { name: 'Cyan', hex: '#06b6d4' }
  ]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(['Polycarbonate']);
  const [customMaterial, setCustomMaterial] = useState('');

  const [proposedRetail, setProposedRetail] = useState('100.00');
  const [costPrice, setCostPrice] = useState('45.00');
  const [proposedQty, setProposedQty] = useState('25');

  // Queries
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  // Mutation
  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/catalog/products', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success('New Item created successfully');
      navigate('/products');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create item');
    },
  });

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotos([...photos, photoInput.trim()]);
    setPhotoInput('');
  };

  const handleToggleColor = (c: ColorSwatch) => {
    const exists = selectedColors.some((sc) => sc.hex === c.hex);
    if (exists) {
      setSelectedColors(selectedColors.filter((sc) => sc.hex !== c.hex));
    } else {
      setSelectedColors([...selectedColors, c]);
    }
  };

  const handleToggleMaterial = (m: string) => {
    if (selectedMaterials.includes(m)) {
      setSelectedMaterials(selectedMaterials.filter((sm) => sm !== m));
    } else {
      setSelectedMaterials([...selectedMaterials, m]);
    }
  };

  const handleAddCustomMaterial = () => {
    if (!customMaterial.trim()) return;
    if (!selectedMaterials.includes(customMaterial.trim())) {
      setSelectedMaterials([...selectedMaterials, customMaterial.trim()]);
    }
    setCustomMaterial('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Item name is required');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      category_id: categoryId ? Number(categoryId) : 1,
      supplier_id: supplierId ? Number(supplierId) : null,
      supplier_ref: supplierRef.trim() || null,
      our_ref: ourRef.trim() || null,
      ba_ref: baRef.trim(),
      brand: brand.trim() || null,
      season: season.trim() || null,
      department: department.trim() || null,
      colors: selectedColors,
      materials: selectedMaterials,
      proposed_retail: parseFloat(proposedRetail) || 0,
      proposed_qty: parseInt(proposedQty, 10) || 0,
      image_url: photos[0] || null,
      photos,
      cost_price: parseFloat(costPrice) || 0,
      selling_price: parseFloat(proposedRetail) || 0,
      stock_quantity: parseInt(proposedQty, 10) || 0,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Bar matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">New Item</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Create a new item with photos, supplier specifications, colors, and materials.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            form="new-item-form"
            disabled={createMutation.isPending}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md transition-all flex items-center gap-2"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Item'}
          </button>
        </div>
      </div>

      <form id="new-item-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Item Title Input */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Item Title / Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ahhahaha Modular Hardshell Carry-On"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 text-base font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {/* Photos Upload Zone matching Image 2 */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Photos</h2>

          <div className="p-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Add photos</p>
              <p className="text-2xs text-slate-400 dark:text-zinc-500">Upload from device or pick from your library</p>
            </div>

            <div className="flex justify-center items-center gap-2 max-w-md mx-auto pt-2">
              <input
                type="url"
                placeholder="Paste Image URL..."
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white"
              />
              <button type="button" onClick={handleAddPhoto} className="btn-secondary text-xs px-3 py-1.5">Add Photo</button>
            </div>
          </div>

          {/* Photo Gallery Thumbnails */}
          {photos.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-2">
              {photos.map((url, idx) => (
                <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-sm bg-slate-100">
                  <img src={url} alt="Item photo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplier & Reference Card matching Image 2 */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Supplier & References</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              >
                <option value="">Select Supplier</option>
                {(suppliers ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.country_flag || '🇺🇸'} {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Supplier Item Reference *</label>
              <input
                type="text"
                placeholder="e.g. AZY-990"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Our Item Reference</label>
              <input
                type="text"
                placeholder="e.g. OUR-AZY-01"
                value={ourRef}
                onChange={(e) => setOurRef(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">BA Unique Reference</label>
              <input
                type="text"
                readOnly
                value={baRef}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Classification Card matching Image 2 */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Classification & Department</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Season</label>
              <input
                type="text"
                placeholder="e.g. Eco Travel Collection (SEA010)"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Department</label>
              <input
                type="text"
                placeholder="e.g. Travel & Luggage"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Brand</label>
              <input
                type="text"
                placeholder="e.g. ExploreHub / Horizon Travel"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Category Taxonomy</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              >
                {(categories ?? []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Attributes: Colors & Materials matching Image 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Color Swatch Picker */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-500" /> Colour Swatches
            </h2>
            <p className="text-2xs text-slate-400">Select all colors available for this product</p>

            <div className="flex flex-wrap gap-2 pt-2">
              {PRESET_COLORS.map((c) => {
                const isSelected = selectedColors.some((sc) => sc.hex === c.hex);
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleToggleColor(c)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 font-bold shadow-sm' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Material Tag Picker */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-cyan-500" /> Materials
            </h2>
            <p className="text-2xs text-slate-400">Select or add materials used in construction</p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {PRESET_MATERIALS.map((m) => {
                const isSelected = selectedMaterials.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleToggleMaterial(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${isSelected ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 font-bold shadow-sm' : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'}`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom material..."
                value={customMaterial}
                onChange={(e) => setCustomMaterial(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              />
              <button type="button" onClick={handleAddCustomMaterial} className="btn-secondary text-xs px-3 py-1.5">Add</button>
            </div>
          </div>
        </div>

        {/* Pricing & Stock Card */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Pricing & Inventory</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Proposed Retail Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={proposedRetail}
                onChange={(e) => setProposedRetail(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Supplier Cost Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Proposed Stock Quantity</label>
              <input
                type="number"
                required
                value={proposedQty}
                onChange={(e) => setProposedQty(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
