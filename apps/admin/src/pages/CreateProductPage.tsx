import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, Plus, Trash2, Tag, Layers, Check, Sparkles, Sliders, Star, FileText, Image,
  Bold, Italic, Heading, List, ListOrdered, Quote, AlertCircle, ChevronDown, Search
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  country_code?: string;
  country_flag?: string;
}

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
}

interface Collection {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface OptionGroup {
  id: string;
  name: string;
  values: string[];
}

interface VariantItem {
  id?: number;
  sku: string;
  label: string;
  optionValueIds?: number[];
  cost_price: string;
  selling_price: string;
  stock_quantity: string;
  low_stock_threshold: string;
  image_url?: string;
}

async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get('/catalog/suppliers');
  return data.data as Supplier[];
}

async function fetchCategories(): Promise<CategoryNode[]> {
  const { data } = await api.get('/catalog/categories');
  return data.data as CategoryNode[];
}

async function fetchCollections(): Promise<Collection[]> {
  const { data } = await api.get('/catalog/collections');
  return data.data as Collection[];
}

export default function CreateProductPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const handleFormatDescription = (prefix: string, suffix: string = '') => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = description.substring(start, end);
    const before = description.substring(0, start);
    const after = description.substring(end);

    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}text${suffix}`;
    const newText = `${before}${replacement}${after}`;

    setDescription(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length + (selectedText ? 0 : 4));
    }, 0);
  };

  // Basic Details State
  const [name, setName] = useState(isEditMode ? '' : 'Ahhahaha Modular Hardshell Carry-On');
  const [photos, setPhotos] = useState<string[]>([]);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

  // Collections State
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<number[]>(isEditMode ? [] : [1]);
  const [newCollectionModalOpen, setNewCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Category & Subcategory Hierarchy State
  const [parentCategoryId, setParentCategoryId] = useState<string>('');
  const [subCategoryId, setSubCategoryId] = useState<string>('');

  // Supplier State
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierRef, setSupplierRef] = useState(isEditMode ? '' : 'AZY-990');
  const [ourRef, setOurRef] = useState(isEditMode ? '' : 'OUR-AZY-01');
  const [brand, setBrand] = useState(isEditMode ? '' : 'ExploreHub');
  const [baRef] = useState(`BA-${Math.floor(1000 + Math.random() * 9000)}`);
  const [description, setDescription] = useState('');

  // New Supplier Modal & Searchable Dropdown State
  const [newSupplierModalOpen, setNewSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCountryCode, setNewSupplierCountryCode] = useState('US');
  const [newSupplierCountryFlag, setNewSupplierCountryFlag] = useState('🇺🇸');

  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Close supplier dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setSupplierDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Options State (Color, Size, etc.)
  const [options, setOptions] = useState<OptionGroup[]>(
    isEditMode
      ? []
      : [
          { id: 'opt-1', name: 'Color', values: ['Red', 'Blue'] },
          { id: 'opt-2', name: 'Size', values: ['Small', 'Medium'] }
        ]
  );
  const [newOptionValueInputs, setNewOptionValueInputs] = useState<Record<string, string>>({});

  // Variants State
  const [samePriceForAll, setSamePriceForAll] = useState<boolean>(false);
  const [deletedVariantSkus, setDeletedVariantSkus] = useState<string[]>([]);
  const [variantPriceOverrides, setVariantPriceOverrides] = useState<Record<string, Partial<VariantItem>>>(
    isEditMode
      ? {}
      : {
          'AZY-990-RED-S': { cost_price: '38.00', selling_price: '80.00', stock_quantity: '12', low_stock_threshold: '5' },
          'AZY-990-RED-M': { cost_price: '42.00', selling_price: '95.00', stock_quantity: '8', low_stock_threshold: '5' },
          'AZY-990-BLU-S': { cost_price: '38.00', selling_price: '80.00', stock_quantity: '20', low_stock_threshold: '5' },
          'AZY-990-BLU-M': { cost_price: '42.00', selling_price: '95.00', stock_quantity: '14', low_stock_threshold: '5' },
        }
  );

  // Queries
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: fetchSuppliers });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: collections } = useQuery({ queryKey: ['collections'], queryFn: fetchCollections });

  const { data: editProduct } = useQuery({
    queryKey: ['product-edit', id],
    queryFn: async () => {
      const { data } = await api.get(`/catalog/products/${id}`);
      return data.data;
    },
    enabled: isEditMode,
  });

  // Populate form fields in Edit mode
  useEffect(() => {
    if (editProduct) {
      if (editProduct.name) setName(editProduct.name);
      if (editProduct.photos && Array.isArray(editProduct.photos) && editProduct.photos.length > 0) {
        setPhotos(editProduct.photos);
      } else if (editProduct.image_url) {
        setPhotos([editProduct.image_url]);
      }
      if (editProduct.supplier_id) setSupplierId(String(editProduct.supplier_id));
      if (editProduct.supplier_ref) setSupplierRef(editProduct.supplier_ref);
      if (editProduct.our_ref) setOurRef(editProduct.our_ref);
      if (editProduct.brand) setBrand(editProduct.brand);
      if (editProduct.description) setDescription(editProduct.description);

      if (editProduct.categories && editProduct.categories[0]?.id) {
        setParentCategoryId(String(editProduct.categories[0].id));
      }
      if (editProduct.collections && Array.isArray(editProduct.collections)) {
        setSelectedCollectionIds(editProduct.collections.map((c: any) => c.id));
      }

      if (editProduct.variants && editProduct.variants.length > 0) {
        const overrides: Record<string, Partial<VariantItem>> = {};
        for (const v of editProduct.variants) {
          overrides[v.sku] = {
            cost_price: String(v.cost_price || '0.00'),
            selling_price: String(v.selling_price || '0.00'),
            stock_quantity: String(v.stock_quantity || '0'),
            low_stock_threshold: String(v.low_stock_threshold || '5'),
            image_url: v.image_url,
          };
        }
        setVariantPriceOverrides(overrides);
      }
    }
  }, [editProduct]);

  // Filter root categories (parent_id is null/undefined/0) vs subcategories
  const rootCategories = useMemo(() => {
    return (categories ?? []).filter((c) => !c.parent_id);
  }, [categories]);

  const subCategories = useMemo(() => {
    if (!parentCategoryId) return [];
    return (categories ?? []).filter((c) => String(c.parent_id) === String(parentCategoryId));
  }, [categories, parentCategoryId]);

  // Filtered suppliers for searchable select dropdown
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!supplierSearchQuery.trim()) return suppliers;
    const q = supplierSearchQuery.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.country_code?.toLowerCase().includes(q));
  }, [suppliers, supplierSearchQuery]);

  const selectedSupplier = useMemo(() => {
    return (suppliers ?? []).find((s) => String(s.id) === String(supplierId));
  }, [suppliers, supplierId]);

  // Create Collection Mutation
  const createCollectionMutation = useMutation({
    mutationFn: (nameStr: string) => api.post('/catalog/collections', { name: nameStr }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      const newCol = res.data.data;
      if (newCol?.id) {
        setSelectedCollectionIds((prev) => [...prev, newCol.id]);
      }
      setNewCollectionModalOpen(false);
      setNewCollectionName('');
      toast.success('Collection created!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create collection');
    }
  });

  // Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: (data: { name: string; country_code: string; country_flag: string }) =>
      api.post('/catalog/suppliers', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      const newSup = res.data.data;
      if (newSup?.id) {
        setSupplierId(String(newSup.id));
      }
      setNewSupplierModalOpen(false);
      setNewSupplierName('');
      toast.success('Supplier created successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create supplier');
    },
  });

  // File Upload Handler (System File Chooser)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Set any photo as the primary Cover photo (moves it to index 0)
  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setPhotos((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
    toast.success('Set as primary cover photo!');
  };

  // HTML5 Drag and Drop Handlers for Photo Reordering
  const handleDragStart = (index: number) => {
    setDraggedPhotoIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedPhotoIndex === null || draggedPhotoIndex === targetIndex) return;

    setPhotos((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedPhotoIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedPhotoIndex(null);
  };

  // Toggle Collection selection
  const handleToggleCollection = (colId: number) => {
    if (selectedCollectionIds.includes(colId)) {
      setSelectedCollectionIds(selectedCollectionIds.filter((id) => id !== colId));
    } else {
      setSelectedCollectionIds([...selectedCollectionIds, colId]);
    }
  };

  // Option Handlers
  const handleAddOptionGroup = () => {
    const newId = `opt-${Date.now()}`;
    setOptions([...options, { id: newId, name: `Option ${options.length + 1}`, values: [] }]);
  };

  const handleRemoveOptionGroup = (optId: string) => {
    setOptions(options.filter((o) => o.id !== optId));
  };

  const handleUpdateOptionName = (optId: string, nameVal: string) => {
    setOptions(options.map((o) => (o.id === optId ? { ...o, name: nameVal } : o)));
  };

  const handleAddOptionValue = (optId: string) => {
    const val = (newOptionValueInputs[optId] || '').trim();
    if (!val) return;
    setOptions(
      options.map((o) => {
        if (o.id === optId && !o.values.includes(val)) {
          return { ...o, values: [...o.values, val] };
        }
        return o;
      })
    );
    setNewOptionValueInputs((prev) => ({ ...prev, [optId]: '' }));
  };

  const handleRemoveOptionValue = (optId: string, valueStr: string) => {
    setOptions(
      options.map((o) => {
        if (o.id === optId) {
          return { ...o, values: o.values.filter((v) => v !== valueStr) };
        }
        return o;
      })
    );
  };

  // Compute live cartesian product of option values
  const allGeneratedVariants = useMemo(() => {
    const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) {
      const sku = supplierRef ? `${supplierRef}-STD` : `SKU-STD`;
      const override = variantPriceOverrides[sku] || {};
      return [
        {
          sku,
          label: 'Standard',
          cost_price: override.cost_price ?? '38.00',
          selling_price: override.selling_price ?? '80.00',
          stock_quantity: override.stock_quantity ?? '10',
          low_stock_threshold: override.low_stock_threshold ?? '5',
          image_url: override.image_url ?? photos[0] ?? '',
        }
      ];
    }

    // Cartesian product helper
    const cartesian = (acc: { label: string; skuParts: string[] }[], option: OptionGroup) => {
      const result: { label: string; skuParts: string[] }[] = [];
      for (const item of acc) {
        for (const val of option.values) {
          const shortVal = val.trim().toUpperCase().slice(0, 1);
          result.push({
            label: item.label ? `${item.label} / ${val}` : val,
            skuParts: [...item.skuParts, shortVal]
          });
        }
      }
      return result;
    };

    let combos = validOptions[0].values.map((v) => ({
      label: v,
      skuParts: [v.trim().toUpperCase().slice(0, 1)]
    }));

    for (let i = 1; i < validOptions.length; i++) {
      combos = cartesian(combos, validOptions[i]);
    }

    const prefix = supplierRef.trim() || 'SKU';
    return combos.map((c) => {
      const sku = `${prefix}-${c.skuParts.join('-')}`;
      const override = variantPriceOverrides[sku] || {};
      return {
        sku,
        label: c.label,
        cost_price: override.cost_price ?? '38.00',
        selling_price: override.selling_price ?? '80.00',
        stock_quantity: override.stock_quantity ?? '10',
        low_stock_threshold: override.low_stock_threshold ?? '5',
        image_url: override.image_url ?? photos[0] ?? '',
      };
    });
  }, [options, supplierRef, variantPriceOverrides, photos]);

  // Filter out any variant deleted/excluded by user
  const generatedVariants = useMemo(() => {
    return allGeneratedVariants.filter((v) => !deletedVariantSkus.includes(v.sku));
  }, [allGeneratedVariants, deletedVariantSkus]);

  // Update variant inputs
  const handleUpdateVariantField = (sku: string, field: keyof VariantItem, val: string) => {
    if (samePriceForAll) {
      // Update all variants to the same price/cost/stock
      setVariantPriceOverrides((prev) => {
        const next: Record<string, Partial<VariantItem>> = {};
        for (const v of generatedVariants) {
          next[v.sku] = {
            ...(prev[v.sku] || {}),
            [field]: val,
          };
        }
        return next;
      });
    } else {
      setVariantPriceOverrides((prev) => ({
        ...prev,
        [sku]: {
          ...(prev[sku] || {}),
          [field]: val,
        }
      }));
    }
  };

  // Variant Exclusion/Deletion Handlers
  const handleDeleteVariant = (sku: string) => {
    setDeletedVariantSkus((prev) => [...prev, sku]);
    toast.success(`Variant ${sku} removed`);
  };

  const handleRestoreVariants = () => {
    setDeletedVariantSkus([]);
    toast.info('Restored all deleted variations');
  };

  // Form Validation & Errors State
  interface FormErrors {
    name?: string;
    photos?: string;
  }
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Item title is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Item title must be at least 3 characters long';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please resolve the highlighted errors in red before submitting.');
      return false;
    }
    return true;
  };

  // Submission Pipeline
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (
    e?: React.FormEvent,
    targetStatus: 'draft' | 'active' = 'active'
  ) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const category_ids: number[] = [];
    if (subCategoryId) category_ids.push(Number(subCategoryId));
    if (parentCategoryId) category_ids.push(Number(parentCategoryId));
    if (category_ids.length === 0 && categories && categories.length > 0) {
      category_ids.push(categories[0].id);
    }

    const seed_cost = parseFloat(generatedVariants[0]?.cost_price || '0') || 0;
    const seed_selling = parseFloat(generatedVariants[0]?.selling_price || '0') || 0;
    const seed_stock = parseInt(generatedVariants[0]?.stock_quantity || '0', 10) || 0;

    setSubmitting(true);

    if (isEditMode) {
      try {
        await api.put(`/catalog/products/${id}`, {
          name: name.trim(),
          supplier_id: supplierId ? Number(supplierId) : null,
          supplier_ref: supplierRef.trim() || null,
          our_ref: ourRef.trim() || null,
          brand: brand.trim() || null,
          description: description.trim() || null,
          status: targetStatus,
          category_ids,
          collection_ids: selectedCollectionIds,
          image_url: photos[0] || null,
          photos,
        });

        if (editProduct?.variants && editProduct.variants.length > 0) {
          for (const dbV of editProduct.variants) {
            const overrides = variantPriceOverrides[dbV.sku];
            if (overrides) {
              await api.patch(`/catalog/variants/${dbV.id}`, {
                cost_price: parseFloat(overrides.cost_price || '0'),
                selling_price: parseFloat(overrides.selling_price || '0'),
                stock_quantity: parseInt(overrides.stock_quantity || '0', 10),
                low_stock_threshold: parseInt(overrides.low_stock_threshold || '5', 10),
              });
            }
          }
        }

        qc.invalidateQueries({ queryKey: ['products'] });
        qc.invalidateQueries({ queryKey: ['product-detail', id] });
        qc.invalidateQueries({ queryKey: ['product-edit', id] });
        toast.success(targetStatus === 'draft' ? 'Item changes saved as draft!' : 'Product updated successfully!');
        setSubmitting(false);
        navigate('/products');
        return;
      } catch (err: any) {
        setSubmitting(false);
        toast.error(err.response?.data?.message || 'Failed to update item');
        return;
      }
    }

    try {
      // 1. Create base product with chosen status (draft or active)
      const createRes = await api.post('/catalog/products', {
        name: name.trim(),
        supplier_id: supplierId ? Number(supplierId) : null,
        supplier_ref: supplierRef.trim() || null,
        our_ref: ourRef.trim() || null,
        ba_ref: baRef,
        brand: brand.trim() || null,
        description: description.trim() || null,
        status: targetStatus,
        category_ids,
        collection_ids: selectedCollectionIds,
        image_url: photos[0] || null,
        photos,
        seed_cost_price: seed_cost,
        seed_selling_price: seed_selling,
        seed_stock_quantity: seed_stock,
      });

      const product = createRes.data.data;
      const productId = product.id;

      // 2. Add options if defined
      const validOptions = options.filter((o) => o.name.trim() && o.values.length > 0);
      if (validOptions.length > 0) {
        await api.post(`/catalog/products/${productId}/options`, {
          options: validOptions.map((o) => ({ name: o.name.trim(), values: o.values }))
        });

        // 3. Generate DB variants
        const genRes = await api.post(`/catalog/products/${productId}/variants/generate`);
        const createdProductWithVariants = genRes.data.data;
        const createdDbVariants = createdProductWithVariants.variants || [];

        // 4. Update each generated variant with prices/stock/photo
        for (const dbV of createdDbVariants) {
          const clientV = generatedVariants.find((gv) => gv.sku === dbV.sku);
          if (!clientV) {
            // User deleted this variant combination on frontend
            try {
              await api.delete(`/catalog/variants/${dbV.id}`);
            } catch {
              // Ignore if delete non-fatal
            }
          } else {
            await api.patch(`/catalog/variants/${dbV.id}`, {
              cost_price: parseFloat(clientV.cost_price) || 0,
              selling_price: parseFloat(clientV.selling_price) || 0,
              stock_quantity: parseInt(clientV.stock_quantity, 10) || 0,
              low_stock_threshold: parseInt(clientV.low_stock_threshold, 10) || 5,
              image_url: clientV.image_url || photos[0] || null,
            });
          }
        }
      }

      // 5. Publish product if active requested
      if (targetStatus === 'active') {
        try {
          await api.post(`/catalog/products/${productId}/publish`);
        } catch {
          // If already active, ignore error
        }
      }

      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(
        targetStatus === 'draft'
          ? 'Product saved as Draft!'
          : 'Product published successfully!'
      );
      navigate('/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{isEditMode ? `Edit Item #${id}` : 'New Item'}</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              {isEditMode ? 'Update product details, photos, supplier refs, description and variants.' : 'Configure collections, category tree, options and generate variants.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(undefined, 'draft')}
            disabled={submitting}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(undefined, 'active')}
            disabled={submitting}
            className="px-5 py-2.5 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md transition-all flex items-center gap-2"
          >
            {submitting ? 'Saving Product...' : 'Publish Item'}
          </button>
        </div>
      </div>

      <form id="new-item-form" onSubmit={(e) => handleSubmit(e, 'active')} className="space-y-6">
        {/* Top Validation Error Alert Banner */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 flex items-center gap-3 shadow-xs transition-all">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <div className="text-xs">
              <h4 className="font-bold">Form validation attention required:</h4>
              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-2xs">
                {errors.name && <li>{errors.name}</li>}
                {errors.photos && <li>{errors.photos}</li>}
              </ul>
            </div>
          </div>
        )}

        {/* Photos Section */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Product Photos</h2>
            <span className="text-2xs font-semibold text-slate-400 dark:text-zinc-500">{photos.length} photo(s)</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          {photos.length === 0 ? (
            /* CLICKABLE DROPZONE WHEN NO PHOTOS */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-5 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer group text-center sm:text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Add Product Gallery Photos
                  </p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">
                    Click anywhere to select image files from your computer
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-2xs transition-all whitespace-nowrap"
              >
                Browse Files
              </button>
            </div>
          ) : (
            /* GALLERY GRID WITH DRAG & DROP REORDERING & STAR COVER ICONS */
            <div className="flex flex-wrap items-center gap-3">
              {photos.map((url, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(idx)}
                  className={`relative group w-24 h-24 rounded-xl overflow-hidden border transition-all cursor-grab active:cursor-grabbing ${
                    draggedPhotoIndex === idx
                      ? 'opacity-40 border-cyan-500 scale-95 ring-2 ring-cyan-500/50'
                      : 'border-slate-200 dark:border-zinc-700 hover:border-cyan-500 shadow-2xs bg-slate-100 dark:bg-zinc-800'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* Star Cover Icon */}
                  {idx === 0 ? (
                    <div
                      className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-black/60 text-amber-400 backdrop-blur-xs flex items-center justify-center shadow-xs"
                      title="Primary Cover Photo"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMakeCover(idx);
                      }}
                      className="absolute top-1.5 left-1.5 p-1 rounded-lg bg-black/50 hover:bg-amber-500 text-white opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                      title="Set as Cover Photo"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Trash Icon */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotos(photos.filter((_, i) => i !== idx));
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/50 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-all shadow-xs"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Clickable Add File Tile */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors flex flex-col items-center justify-center p-2 text-center group cursor-pointer"
              >
                <Plus className="w-5 h-5 text-slate-400 group-hover:text-cyan-500 transition-colors mb-0.5" />
                <span className="text-3xs font-semibold text-slate-400 group-hover:text-cyan-500">Add File</span>
              </button>
            </div>
          )}
        </div>

        {/* Item Title Input */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-2">
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Item title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Ahhahaha Modular Hardshell Carry-On"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            className={`w-full p-3 text-base font-bold rounded-xl border transition-all ${
              errors.name
                ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-rose-900 dark:text-rose-100 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20'
            }`}
          />
          {errors.name && (
            <p className="text-2xs font-medium text-rose-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" /> {errors.name}
            </p>
          )}
        </div>

        {/* Collections Section */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-500" /> Collections
          </label>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {(collections ?? []).map((col) => {
              const isSelected = selectedCollectionIds.includes(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => handleToggleCollection(col.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isSelected
                      ? 'border-cyan-600 bg-cyan-600 text-white font-semibold shadow-sm'
                      : 'border-slate-300 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {col.name}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setNewCollectionModalOpen(true)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-dashed border-slate-300 dark:border-zinc-700 bg-transparent text-slate-600 dark:text-zinc-400 hover:border-cyan-500 hover:text-cyan-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Category Hierarchy Section (Parent + Subcategory) */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-cyan-500" /> Category & Subcategory
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-zinc-400">Primary Category</label>
              <select
                value={parentCategoryId}
                onChange={(e) => {
                  setParentCategoryId(e.target.value);
                  setSubCategoryId('');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800"
              >
                <option value="">Select Category</option>
                {rootCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-zinc-400">Subcategory</label>
              <select
                disabled={!parentCategoryId || subCategories.length === 0}
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 disabled:opacity-50"
              >
                <option value="">{subCategories.length === 0 ? 'No subcategories' : 'Select Subcategory'}</option>
                {subCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Supplier & Reference Section */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Supplier & Item Reference</label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-zinc-400">Supplier</label>

              <div className="relative" ref={supplierDropdownRef}>
                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={() => setSupplierDropdownOpen((prev) => !prev)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-left flex items-center justify-between text-slate-900 dark:text-white hover:border-cyan-500 transition-colors"
                >
                  <span className="truncate flex items-center gap-2">
                    {selectedSupplier ? (
                      <>
                        <span>{selectedSupplier.country_flag || '🇺🇸'}</span>
                        <span className="font-medium">{selectedSupplier.name}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-zinc-500">Select Supplier</span>
                    )}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${supplierDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Searchable Dropdown Popover */}
                {supplierDropdownOpen && (
                  <div className="absolute z-30 top-full left-0 right-0 mt-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden flex flex-col">
                    {/* Sticky Search Input Header */}
                    <div className="p-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/90 backdrop-blur-xs sticky top-0 z-10">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Search supplier..."
                          value={supplierSearchQuery}
                          onChange={(e) => setSupplierSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Scrollable Suppliers List */}
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/50">
                      <div
                        onClick={() => {
                          setSupplierId('');
                          setSupplierDropdownOpen(false);
                        }}
                        className={`p-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                          !supplierId ? 'bg-cyan-50/60 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 font-medium' : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        <span>Select Supplier (None)</span>
                        {!supplierId && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                      </div>

                      {filteredSuppliers.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400 dark:text-zinc-500">
                          No suppliers found
                        </div>
                      ) : (
                        filteredSuppliers.map((s) => {
                          const isSelected = String(s.id) === String(supplierId);
                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSupplierId(String(s.id));
                                setSupplierDropdownOpen(false);
                              }}
                              className={`p-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors hover:bg-slate-100 dark:hover:bg-zinc-800 ${
                                isSelected ? 'bg-cyan-50/60 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 font-semibold' : 'text-slate-800 dark:text-zinc-200'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span>{s.country_flag || '🇺🇸'}</span>
                                <span>{s.name}</span>
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600" />}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Pinned Sticky "+ Add New Supplier..." Footer */}
                    <div
                      onClick={() => {
                        setSupplierDropdownOpen(false);
                        setNewSupplierModalOpen(true);
                      }}
                      className="sticky bottom-0 border-t border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-2.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add New Supplier...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-600 dark:text-zinc-400">Supplier Item Reference</label>
              <input
                type="text"
                placeholder="e.g. AZY-990"
                value={supplierRef}
                onChange={(e) => setSupplierRef(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Options Section */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-500" /> Options
            </h2>
          </div>

          <div className="space-y-4">
            {options.map((opt) => (
              <div key={opt.id} className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Option Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Color, Size, Material..."
                      value={opt.name}
                      onChange={(e) => handleUpdateOptionName(opt.id, e.target.value)}
                      className="font-bold text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-cyan-500/20 text-slate-900 dark:text-white w-48"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOptionGroup(opt.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="Remove option group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {opt.values.length === 0 && (
                    <span className="text-2xs text-slate-400 dark:text-zinc-500 italic pr-2">
                      No values added yet. Type below (e.g. Red, XL) and click +
                    </span>
                  )}
                  {opt.values.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-2xs text-slate-900 dark:text-white"
                    >
                      {v}
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionValue(opt.id, v)}
                        className="text-slate-400 hover:text-rose-500 ml-0.5 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add value..."
                      value={newOptionValueInputs[opt.id] || ''}
                      onChange={(e) => setNewOptionValueInputs({ ...newOptionValueInputs, [opt.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOptionValue(opt.id);
                        }
                      }}
                      className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 w-32 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddOptionValue(opt.id)}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-2xs transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOptionGroup}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-500" /> Add option
          </button>
        </div>

        {/* Variants Section with Live Generated Matrix & Toggle */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Variants · {generatedVariants.length} active
              </h2>
              {deletedVariantSkus.length > 0 && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                    {deletedVariantSkus.length} excluded
                  </span>
                  <button
                    type="button"
                    onClick={handleRestoreVariants}
                    className="text-2xs font-bold text-cyan-600 hover:underline"
                  >
                    Restore All
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-600 dark:text-zinc-400">Same price for all</span>
              <button
                type="button"
                role="switch"
                aria-checked={samePriceForAll}
                onClick={() => setSamePriceForAll(!samePriceForAll)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  samePriceForAll ? 'bg-cyan-600' : 'bg-slate-200 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    samePriceForAll ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Variants Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Variant Photo</th>
                  <th className="py-2.5 px-3">SKU & Label</th>
                  <th className="py-2.5 px-3">Cost ($)</th>
                  <th className="py-2.5 px-3">Price ($)</th>
                  <th className="py-2.5 px-3">Stock</th>
                  <th className="py-2.5 px-3">Low Stock</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-mono">
                {generatedVariants.map((v) => (
                  <tr key={v.sku} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {v.image_url ? (
                            <img src={v.image_url} alt="Variant Swatch" className="w-full h-full object-cover" />
                          ) : (
                            <Image className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <select
                          value={v.image_url || ''}
                          onChange={(e) => handleUpdateVariantField(v.sku, 'image_url', e.target.value)}
                          className="p-1 text-2xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 w-28 font-sans font-medium"
                        >
                          <option value="">Default (Cover)</option>
                          {photos.map((pUrl, pIdx) => (
                            <option key={pIdx} value={pUrl}>
                              Photo #{pIdx + 1} {pIdx === 0 ? '(Cover)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      <div>{v.sku}</div>
                      <div className="text-2xs font-normal text-slate-400 dark:text-zinc-500 font-sans">{v.label}</div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.cost_price}
                        onChange={(e) => handleUpdateVariantField(v.sku, 'cost_price', e.target.value)}
                        className="w-24 p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={v.selling_price}
                        onChange={(e) => handleUpdateVariantField(v.sku, 'selling_price', e.target.value)}
                        className="w-24 p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={v.stock_quantity}
                        onChange={(e) => handleUpdateVariantField(v.sku, 'stock_quantity', e.target.value)}
                        className="w-20 p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={v.low_stock_threshold}
                        onChange={(e) => handleUpdateVariantField(v.sku, 'low_stock_threshold', e.target.value)}
                        className="w-20 p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-bold text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.sku)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete this variant combination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Description & Storefront Details Section (Last Section) */}
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-500" /> Storefront Description & Detailed Overview
            </label>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-xs">
            <button
              type="button"
              onClick={() => handleFormatDescription('**', '**')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors font-bold"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatDescription('*', '*')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors italic"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatDescription('### ')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
              title="Heading"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-zinc-700 mx-1" />
            <button
              type="button"
              onClick={() => handleFormatDescription('\n- ')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatDescription('\n1. ')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleFormatDescription('\n> ')}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors"
              title="Quote Block"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          <textarea
            ref={descriptionRef}
            rows={5}
            placeholder="Write detailed product description, key features, material specifications, bullet points, and care instructions..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-cyan-500/20 resize-y font-sans"
          />
        </div>
      </form>

      {/* New Collection Modal */}
      <Modal
        isOpen={newCollectionModalOpen}
        onClose={() => setNewCollectionModalOpen(false)}
        title="Add New Collection"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Collection Name *</label>
            <input
              type="text"
              placeholder="e.g. Summer Sale / New Arrivals"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewCollectionModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!newCollectionName.trim() || createCollectionMutation.isPending}
              onClick={() => createCollectionMutation.mutate(newCollectionName.trim())}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700"
            >
              {createCollectionMutation.isPending ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </div>
      </Modal>

      {/* CREATE NEW SUPPLIER MODAL */}
      <Modal
        isOpen={newSupplierModalOpen}
        onClose={() => setNewSupplierModalOpen(false)}
        title="Add New Supplier"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Supplier / Factory Name *</label>
            <input
              type="text"
              placeholder="e.g. Naseem Express Logistics"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Country Flag Emoji</label>
              <select
                value={newSupplierCountryFlag}
                onChange={(e) => {
                  setNewSupplierCountryFlag(e.target.value);
                  const flagToCode: Record<string, string> = {
                    '🇺🇸': 'US', '🇬🇧': 'GB', '🇨🇳': 'CN', '🇫🇷': 'FR', '🇮🇹': 'IT',
                    '🇩🇪': 'DE', '🇯🇵': 'JP', '🇦🇪': 'AE', '🇵🇰': 'PK', '🇮🇳': 'IN'
                  };
                  if (flagToCode[e.target.value]) setNewSupplierCountryCode(flagToCode[e.target.value]);
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
              >
                <option value="🇺🇸">🇺🇸 United States</option>
                <option value="🇬🇧">🇬🇧 United Kingdom</option>
                <option value="🇨🇳">🇨🇳 China</option>
                <option value="🇫🇷">🇫🇷 France</option>
                <option value="🇮🇹">🇮🇹 Italy</option>
                <option value="🇩🇪">🇩🇪 Germany</option>
                <option value="🇯🇵">🇯🇵 Japan</option>
                <option value="🇦🇪">🇦🇪 UAE</option>
                <option value="🇵🇰">🇵🇰 Pakistan</option>
                <option value="🇮🇳">🇮🇳 India</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-slate-700 dark:text-zinc-300">Country Code</label>
              <input
                type="text"
                placeholder="e.g. US"
                value={newSupplierCountryCode}
                onChange={(e) => setNewSupplierCountryCode(e.target.value.toUpperCase())}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 font-mono text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setNewSupplierModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newSupplierName.trim()) {
                  toast.error('Supplier name is required');
                  return;
                }
                createSupplierMutation.mutate({
                  name: newSupplierName.trim(),
                  country_code: newSupplierCountryCode,
                  country_flag: newSupplierCountryFlag,
                });
              }}
              disabled={createSupplierMutation.isPending || !newSupplierName.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-sm"
            >
              {createSupplierMutation.isPending ? 'Creating...' : 'Create Supplier'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
