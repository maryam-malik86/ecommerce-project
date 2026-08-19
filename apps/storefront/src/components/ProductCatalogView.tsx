'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Search, Plus, Check, Heart, ShoppingCart, X } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';

const T = '#00B4C8';
const N = '#1A2B4A';

export interface SurgicalProduct {
  id: string;
  sku: string;
  name: string;
  specialty: string;
  instrumentType: string;
  subtitle: string;
  price: number;
  compareAtPrice?: number;
  badge?: 'NEW IN' | 'SALE' | 'ISO CERTIFIED' | 'TOP RATED';
  material: string;
  sizeSpec: string;
  finish: string;
  inStock: boolean;
  img: string;
  swatches?: { name: string; colorHex: string }[];
}

const EXTENDED_SURGICAL_PRODUCTS: SurgicalProduct[] = [
  {
    id: '1',
    sku: 'STC-DEN-0114',
    name: 'Kelila Periodontal Scaler Set',
    specialty: 'Dental',
    instrumentType: 'Elevators & Scalers',
    subtitle: '4-piece precision dental extraction set',
    price: 30,
    compareAtPrice: 89.95,
    material: 'German steel, 440A',
    sizeSpec: 'Set: 140-168mm',
    finish: 'Satin Matte',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Teal Accent', colorHex: '#00B4C8' },
      { name: 'Navy Steel', colorHex: '#1A2B4A' },
    ],
  },
  {
    id: '2',
    sku: 'STC-GEN-0089',
    name: 'Margaritaa Extraction Forceps',
    specialty: 'General Surgery',
    instrumentType: 'Forceps & Clamps',
    subtitle: 'Fine delicate dissecting forceps',
    price: 55,
    compareAtPrice: 69.95,
    material: 'German steel, 420',
    sizeSpec: '115mm (Fine)',
    finish: 'Mirror Polish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Rose Accent', colorHex: '#E11D48' },
      { name: 'Teal Accent', colorHex: '#00B4C8' },
    ],
  },
  {
    id: '3',
    sku: 'STC-GEN-0091',
    name: 'Ollin Dissecting Scissors Hook Tip',
    specialty: 'General Surgery',
    instrumentType: 'Scissors & Shears',
    subtitle: 'Hooked tip blade for clean stitch removal',
    price: 40,
    compareAtPrice: 79.95,
    material: 'German steel, 420',
    sizeSpec: '115mm (Fine)',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Amber', colorHex: '#F59E0B' },
      { name: 'Slate', colorHex: '#374151' },
      { name: 'Silver', colorHex: '#D1D5DB' },
    ],
  },
  {
    id: '4',
    sku: 'STC-ORT-0201',
    name: 'Essana Hemostatic Clamp',
    specialty: 'Orthopedic',
    instrumentType: 'Forceps & Clamps',
    subtitle: 'Ratcheted lock mechanism for fracture alignment',
    price: 45,
    compareAtPrice: 79.95,
    material: 'German steel, 420',
    sizeSpec: '190mm - 200mm',
    finish: 'Heavy Duty Matte',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Navy', colorHex: '#1E293B' },
      { name: 'Amber', colorHex: '#F59E0B' },
    ],
  },
  {
    id: '5',
    sku: 'STC-CAR-0105',
    name: 'Flissie Orthopedic Retractor',
    specialty: 'Cardiovascular',
    instrumentType: 'Retractors & Blades',
    subtitle: 'Ultra-delicate fine ribbed blade retractor',
    price: 60,
    compareAtPrice: 89.95,
    material: '316L stainless',
    sizeSpec: '190mm - 200mm',
    finish: 'Anti-Glare Matte',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Silver', colorHex: '#CBD5E1' },
      { name: 'Teal', colorHex: '#00B4C8' },
      { name: 'Navy', colorHex: '#1E293B' },
    ],
  },
  {
    id: '6',
    sku: 'STC-SPN-0304',
    name: 'Sinus Lift Implant Placement Kit',
    specialty: 'Spine Surgery',
    instrumentType: 'Elevators & Scalers',
    subtitle: 'Radiolucent titanium coated implant kit',
    price: 120,
    compareAtPrice: 160,
    material: 'Tungsten carbide insert',
    sizeSpec: 'Multi-piece Set',
    finish: 'Titanium Nitride',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Teal', colorHex: '#00B4C8' },
      { name: 'Slate', colorHex: '#475569' },
    ],
  },
  {
    id: '7',
    sku: 'STC-GYN-0402',
    name: 'Graves Duckbill Vaginal Speculum',
    specialty: 'Gynecology',
    instrumentType: 'Speculums',
    subtitle: 'Medium adjustable thumb-screw lock speculum',
    price: 48,
    compareAtPrice: 65,
    material: 'German steel, 420',
    sizeSpec: '140mm - 168mm',
    finish: 'High Polish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Teal', colorHex: '#00B4C8' },
      { name: 'Navy', colorHex: '#1A2B4A' },
    ],
  },
  {
    id: '8',
    sku: 'STC-GEN-0112',
    name: 'Mayo-Hegar TC Needle Holder',
    specialty: 'General Surgery',
    instrumentType: 'Needle Holders',
    subtitle: 'Gold-plated ring handles with TC jaw inserts',
    price: 76,
    compareAtPrice: 105,
    material: 'Tungsten carbide insert',
    sizeSpec: '140mm - 168mm',
    finish: 'Gold Handle & Satin',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Gold TiN', colorHex: '#D97706' },
      { name: 'Silver Steel', colorHex: '#CBD5E1' },
    ],
  },
  {
    id: '9',
    sku: 'STC-ORT-0209',
    name: 'Liston Bone Cutting Forceps',
    specialty: 'Orthopedic',
    instrumentType: 'Forceps & Clamps',
    subtitle: 'Compound action angled blades for bone resection',
    price: 135,
    compareAtPrice: 175,
    material: 'German steel, 440A',
    sizeSpec: '190mm - 200mm',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Slate', colorHex: '#475569' },
      { name: 'Silver', colorHex: '#CBD5E1' },
    ],
  },
  {
    id: '10',
    sku: 'STC-GEN-0120',
    name: 'Metzenbaum Curved Dissecting Scissors',
    specialty: 'General Surgery',
    instrumentType: 'Scissors & Shears',
    subtitle: 'Blunt/blunt curved blades for deep tissue dissecting',
    price: 52,
    compareAtPrice: 75,
    material: 'German steel, 420',
    sizeSpec: '140mm - 168mm',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Silver Steel', colorHex: '#CBD5E1' },
      { name: 'Teal Accent', colorHex: '#00B4C8' },
    ],
  },
  {
    id: '11',
    sku: 'STC-ORT-0215',
    name: 'Hohmann Bone Elevator Retractor',
    specialty: 'Orthopedic',
    instrumentType: 'Retractors & Blades',
    subtitle: 'Narrow tip blade for joint exposure',
    price: 68,
    compareAtPrice: 92,
    material: 'German steel, 440A',
    sizeSpec: '190mm - 200mm',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Slate', colorHex: '#374151' },
      { name: 'Silver', colorHex: '#D1D5DB' },
    ],
  },
  {
    id: '12',
    sku: 'STC-ORT-0220',
    name: 'Bone Curette Volkmann Oval',
    specialty: 'Orthopedic',
    instrumentType: 'Elevators & Scalers',
    subtitle: 'Sharp oval cup for bone tissue scraping',
    price: 42,
    compareAtPrice: 58,
    material: 'German steel, 420',
    sizeSpec: '140mm - 168mm',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Navy Steel', colorHex: '#1A2B4A' },
    ],
  },
  {
    id: '13',
    sku: 'STC-CAR-0130',
    name: 'DeBakey Vascular Tissue Forceps',
    specialty: 'Cardiovascular',
    instrumentType: 'Forceps & Clamps',
    subtitle: 'Atraumatic fine serrated tips for vessel handling',
    price: 88,
    compareAtPrice: 120,
    material: '316L stainless',
    sizeSpec: '115mm (Fine)',
    finish: 'Ultra-Fine Polish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Teal Accent', colorHex: '#00B4C8' },
    ],
  },
  {
    id: '14',
    sku: 'STC-CAR-0135',
    name: 'Castroviejo Micro Spring Scissors',
    specialty: 'Cardiovascular',
    instrumentType: 'Scissors & Shears',
    subtitle: 'Micro spring action for delicate microsurgery',
    price: 110,
    compareAtPrice: 150,
    material: 'German steel, 440A',
    sizeSpec: '115mm (Fine)',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Silver', colorHex: '#CBD5E1' },
    ],
  },
  {
    id: '15',
    sku: 'STC-CAR-0140',
    name: 'Cooley Micro Vascular Needle Holder',
    specialty: 'Cardiovascular',
    instrumentType: 'Needle Holders',
    subtitle: 'Ratchet lock handle with fine TC jaws',
    price: 95,
    compareAtPrice: 130,
    material: 'Tungsten carbide insert',
    sizeSpec: '140mm - 168mm',
    finish: 'Gold Handle & Satin',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Gold TiN', colorHex: '#D97706' },
    ],
  },
  {
    id: '16',
    sku: 'STC-SPN-0310',
    name: 'Kerrison Spinal Laminectomy Punch',
    specialty: 'Spine Surgery',
    instrumentType: 'Forceps & Clamps',
    subtitle: '40-degree forward angled bite for spinal bone removal',
    price: 185,
    compareAtPrice: 240,
    material: 'Tungsten carbide insert',
    sizeSpec: '190mm - 200mm',
    finish: 'Titanium Nitride',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Slate', colorHex: '#475569' },
    ],
  },
  {
    id: '17',
    sku: 'STC-SPN-0315',
    name: 'Cobb Spinal Osteotome Elevator',
    specialty: 'Spine Surgery',
    instrumentType: 'Elevators & Scalers',
    subtitle: 'Heavy ergonomic handle for periosteal elevation',
    price: 78,
    compareAtPrice: 105,
    material: 'German steel, 440A',
    sizeSpec: '190mm - 200mm',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Navy Steel', colorHex: '#1A2B4A' },
    ],
  },
  {
    id: '18',
    sku: 'STC-SPN-0320',
    name: 'McCullough Cervical Retractor System',
    specialty: 'Spine Surgery',
    instrumentType: 'Retractors & Blades',
    subtitle: 'Self-retaining cervical retractor frame with blades',
    price: 260,
    compareAtPrice: 320,
    material: '316L stainless',
    sizeSpec: 'Multi-piece Set',
    finish: 'Anti-Glare Matte',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Teal Accent', colorHex: '#00B4C8' },
    ],
  },
  {
    id: '19',
    sku: 'STC-GYN-0410',
    name: 'Sims Vaginal Speculum Double Ended',
    specialty: 'Gynecology',
    instrumentType: 'Speculums',
    subtitle: 'Double-ended duckbill blades for gynecological exam',
    price: 54,
    compareAtPrice: 72,
    material: 'German steel, 420',
    sizeSpec: '140mm - 168mm',
    finish: 'High Polish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Silver', colorHex: '#CBD5E1' },
    ],
  },
  {
    id: '20',
    sku: 'STC-GYN-0415',
    name: 'Bozeman Uterine Dressing Forceps',
    specialty: 'Gynecology',
    instrumentType: 'Forceps & Clamps',
    subtitle: 'S-shaped curved jaws with serrated tips',
    price: 62,
    compareAtPrice: 85,
    material: 'German steel, 420',
    sizeSpec: '190mm - 200mm',
    finish: 'Satin Finish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Navy Steel', colorHex: '#1A2B4A' },
    ],
  },
  {
    id: '21',
    sku: 'STC-DEN-0125',
    name: 'Dental Root Tip Elevator Luxating',
    specialty: 'Dental',
    instrumentType: 'Elevators & Scalers',
    subtitle: 'Straight 3mm sharp blade luxating elevator',
    price: 36,
    compareAtPrice: 50,
    material: 'German steel, 440A',
    sizeSpec: '140mm - 168mm',
    finish: 'Satin Matte',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Teal Accent', colorHex: '#00B4C8' },
    ],
  },
  {
    id: '22',
    sku: 'STC-DEN-0130',
    name: 'Dental Extraction Forceps Upper Molars',
    specialty: 'Dental',
    instrumentType: 'Forceps & Clamps',
    subtitle: 'Anatomically curved beak for upper molar extraction',
    price: 58,
    compareAtPrice: 78,
    material: 'German steel, 420',
    sizeSpec: '140mm - 168mm',
    finish: 'Mirror Polish',
    inStock: true,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    swatches: [
      { name: 'Silver', colorHex: '#CBD5E1' },
    ],
  },
];

interface ProductCatalogViewProps {
  initialProducts?: any[];
}

function ProductCatalogContent({ initialProducts }: ProductCatalogViewProps) {
  const hasMounted = useHasMounted();
  const addToCart = useCartStore((s) => s.addToCart);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const wishlist = useCartStore((s) => s.wishlist);
  const searchParams = useSearchParams();

  // Accordion Expand/Collapse States (collapsible sidebar filters)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    specialty: true,
    type: true,
    material: true,
    size: true,
    price: true,
  });

  // Filter Selection States
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [gridCols, setGridCols] = useState<3 | 4>(3);
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  // Parse URL Parameters (?category=... or ?search=...)
  useEffect(() => {
    if (!searchParams) return;
    const cat = searchParams.get('category');
    const q = searchParams.get('search');

    if (cat) {
      const lower = cat.toLowerCase();
      if (lower.includes('orthopedic')) setSelectedSpecialties(['Orthopedic']);
      else if (lower.includes('cardio')) setSelectedSpecialties(['Cardiovascular']);
      else if (lower.includes('spine')) setSelectedSpecialties(['Spine Surgery']);
      else if (lower.includes('general') || lower.includes('surgery')) setSelectedSpecialties(['General Surgery']);
      else if (lower.includes('gyn')) setSelectedSpecialties(['Gynecology']);
      else if (lower.includes('dental')) setSelectedSpecialties(['Dental']);
      else setSelectedSpecialties([cat]);
    }
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Combine fetched API products with rich extended mock products, filtering out non-medical items
  const allProducts: SurgicalProduct[] = useMemo(() => {
    let medicalOnly: SurgicalProduct[] = [];
    if (initialProducts && Array.isArray(initialProducts) && initialProducts.length > 0) {
      const filteredApi = initialProducts.filter((p: any) => {
        const name = (p.name || '').toLowerCase();
        const cat = (p.primary_category || '').toLowerCase();
        return !['suitcase', 'backpack', 'duffel', 'travel', 'electronics', 'kitchen', 'luggage'].some((term) => name.includes(term) || cat.includes(term));
      });

      if (filteredApi.length > 0) {
        medicalOnly = filteredApi.map((p: any, idx: number) => {
          const variant = p.variants?.[0] || {};
          const price = Number(variant.selling_price || p.price_from || 45);
          const wasPrice = variant.compare_at_price ? Number(variant.compare_at_price) : Math.round(price * 1.35);

          const specialties = ['General Surgery', 'Orthopedic', 'Cardiovascular', 'Spine Surgery', 'Gynecology', 'Dental'];
          const types = ['Scissors & Shears', 'Forceps & Clamps', 'Elevators & Scalers', 'Retractors & Blades', 'Needle Holders', 'Speculums'];
          const materials = ['German steel, 420', 'German steel, 440A', '316L stainless', 'Tungsten carbide insert'];
          const sizes = ['115mm (Fine)', '140mm - 168mm', '190mm - 200mm', 'Multi-piece Set'];

          return {
            id: String(p.id),
            sku: variant.sku || `STC-INS-00${p.id}`,
            name: p.name,
            specialty: p.primary_category || specialties[idx % specialties.length],
            instrumentType: types[idx % types.length],
            subtitle: p.subtitle || p.description || 'OR-grade Surgical Precision Tool',
            price,
            compareAtPrice: wasPrice,
            material: materials[idx % materials.length],
            sizeSpec: sizes[idx % sizes.length],
            finish: idx % 2 === 0 ? 'Satin Finish' : 'Gold Handle TC',
            inStock: true,
            img: variant.image_url || p.image_url || EXTENDED_SURGICAL_PRODUCTS[idx % EXTENDED_SURGICAL_PRODUCTS.length]?.img,
            swatches: [
              { name: 'Teal Accent', colorHex: '#00B4C8' },
              { name: 'Navy Steel', colorHex: '#1A2B4A' },
            ],
          };
        });
      }
    }

    return medicalOnly.length > 0 ? medicalOnly : EXTENDED_SURGICAL_PRODUCTS;
  }, [initialProducts]);

  // Accordion Toggle Helper
  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filter Helper Toggle
  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Clear All Active Filters
  const clearAllFilters = () => {
    setSelectedSpecialties([]);
    setSelectedTypes([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setMaxPrice(350);
    setSearchQuery('');
  };

  // Active Filter Tags List
  const activeTags = useMemo(() => {
    const tags: { key: string; label: string; clear: () => void }[] = [];
    selectedSpecialties.forEach((s) => tags.push({ key: `spec-${s}`, label: `Specialty: ${s}`, clear: () => toggleFilter(selectedSpecialties, setSelectedSpecialties, s) }));
    selectedTypes.forEach((t) => tags.push({ key: `type-${t}`, label: `Type: ${t}`, clear: () => toggleFilter(selectedTypes, setSelectedTypes, t) }));
    selectedMaterials.forEach((m) => tags.push({ key: `mat-${m}`, label: `Material: ${m}`, clear: () => toggleFilter(selectedMaterials, setSelectedMaterials, m) }));
    selectedSizes.forEach((sz) => tags.push({ key: `size-${sz}`, label: `Size: ${sz}`, clear: () => toggleFilter(selectedSizes, setSelectedSizes, sz) }));
    if (maxPrice < 350) tags.push({ key: 'price', label: `Max Price: ≤ $${maxPrice}`, clear: () => setMaxPrice(350) });
    if (searchQuery) tags.push({ key: 'search', label: `Search: "${searchQuery}"`, clear: () => setSearchQuery('') });
    return tags;
  }, [selectedSpecialties, selectedTypes, selectedMaterials, selectedSizes, maxPrice, searchQuery]);

  // Dynamic Filter & Sort Logic (Recalculates count instantly whenever any checkbox or filter changes)
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        if (selectedSpecialties.length > 0) {
          const match = selectedSpecialties.some((s) => p.specialty.toLowerCase() === s.toLowerCase() || p.specialty.toLowerCase().includes(s.toLowerCase()));
          if (!match) return false;
        }
        if (selectedTypes.length > 0) {
          const match = selectedTypes.some((t) => p.instrumentType.toLowerCase() === t.toLowerCase() || p.instrumentType.toLowerCase().includes(t.toLowerCase()));
          if (!match) return false;
        }
        if (selectedMaterials.length > 0) {
          const match = selectedMaterials.some((m) => p.material.toLowerCase() === m.toLowerCase() || p.material.toLowerCase().includes(m.toLowerCase()));
          if (!match) return false;
        }
        if (selectedSizes.length > 0) {
          const match = selectedSizes.some((sz) => p.sizeSpec.toLowerCase() === sz.toLowerCase() || p.sizeSpec.toLowerCase().includes(sz.toLowerCase()));
          if (!match) return false;
        }
        if (p.price > maxPrice) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchSub = p.subtitle.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchSub) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0; // relevance
      });
  }, [allProducts, selectedSpecialties, selectedTypes, selectedMaterials, selectedSizes, maxPrice, searchQuery, sortBy]);

  const handleAddToCart = (p: SurgicalProduct) => {
    addToCart({
      id: p.id,
      sku: p.sku,
      name: p.name,
      price: p.price,
      compareAt: p.compareAtPrice,
      image: p.img,
      category: p.specialty,
      size: p.sizeSpec,
    });

    setAddedItemIds((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [p.id]: false }));
    }, 1500);
  };

  return (
    <div className="bg-white min-h-screen text-slate-900" suppressHydrationWarning>
      {/* 1. TOP BREADCRUMB & PROFESSIONAL CATALOG BANNER */}
      <div className="bg-[#1A2B4A] text-white py-8 px-4 sm:px-6 md:px-10 lg:px-16 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium mb-3">
            <Link href="/" className="hover:text-[#00B4C8] transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-500" />
            <span className="text-[#00B4C8] font-semibold">Surgical Instruments</span>
          </div>

          <div className="max-w-3xl">
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Precision Surgical &amp; Dental Instruments
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
              ISO 13485 &amp; CE Certified medical-grade surgical instruments forged from premium German stainless steel (420 &amp; 440A).
            </p>
          </div>
        </div>
      </div>

      {/* 2. MAIN CATALOG BODY (SIDEBAR FILTERS + DYNAMIC PRODUCT GRID) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT SIDEBAR: CLEAN ACCORDION FILTERS (Matching Screenshot 2) */}
          <div className="lg:col-span-3 space-y-6">
            {/* YOUR SELECTION BLOCK (Matching Screenshot 2) */}
            <div>
              <div className="bg-[#F1F3F5] px-4 py-2.5 text-xs font-extrabold text-slate-800">
                Your Selection
              </div>
              <div className="pt-3 px-1 space-y-2 text-xs">
                <div className="text-slate-500 font-medium">
                  Style: Surgical Instruments
                </div>
                {activeTags.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {activeTags.map((tag) => (
                      <div key={tag.key} className="flex items-center justify-between text-slate-700 py-0.5">
                        <span className="font-semibold text-slate-800">{tag.label}</span>
                        <button onClick={tag.clear} className="text-slate-900 font-bold hover:text-rose-600 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={clearAllFilters}
                      className="text-2xs font-extrabold text-slate-500 hover:text-rose-600 underline pt-1 block"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ACCORDION 1: SELECT SPECIALTY */}
            <div>
              <button
                onClick={() => toggleAccordion('specialty')}
                className="w-full bg-[#F1F3F5] px-4 py-2.5 text-xs font-extrabold text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Select Specialty</span>
                <span className="text-base font-bold text-slate-600">{openAccordions['specialty'] ? '−' : '+'}</span>
              </button>
              {openAccordions['specialty'] && (
                <div className="pt-3 px-1 space-y-2.5 text-xs">
                  {['General Surgery', 'Orthopedic', 'Cardiovascular', 'Spine Surgery', 'Gynecology', 'Dental'].map((spec) => {
                    const isChecked = selectedSpecialties.includes(spec);
                    return (
                      <label key={spec} className="flex items-center text-slate-700 hover:text-slate-900 cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter(selectedSpecialties, setSelectedSpecialties, spec)}
                            className="w-4 h-4 rounded-none border-slate-300 text-[#00B4C8] focus:ring-[#00B4C8] cursor-pointer"
                          />
                          <span className={isChecked ? 'font-bold text-slate-900' : ''}>{spec}</span>
                        </div>
                      </label>
                    );
                  })}
                  <button className="text-2xs font-extrabold text-slate-800 hover:text-[#00B4C8] pt-1 block">
                    + Show More
                  </button>
                </div>
              )}
            </div>

            {/* ACCORDION 2: SELECT INSTRUMENT TYPE */}
            <div>
              <button
                onClick={() => toggleAccordion('type')}
                className="w-full bg-[#F1F3F5] px-4 py-2.5 text-xs font-extrabold text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Select Instrument Type</span>
                <span className="text-base font-bold text-slate-600">{openAccordions['type'] ? '−' : '+'}</span>
              </button>
              {openAccordions['type'] && (
                <div className="pt-3 px-1 space-y-2.5 text-xs">
                  {['Scissors & Shears', 'Forceps & Clamps', 'Elevators & Scalers', 'Retractors & Blades', 'Needle Holders', 'Speculums'].map((type) => {
                    const isChecked = selectedTypes.includes(type);
                    return (
                      <label key={type} className="flex items-center text-slate-700 hover:text-slate-900 cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                            className="w-4 h-4 rounded-none border-slate-300 text-[#00B4C8] focus:ring-[#00B4C8] cursor-pointer"
                          />
                          <span className={isChecked ? 'font-bold text-slate-900' : ''}>{type}</span>
                        </div>
                      </label>
                    );
                  })}
                  <button className="text-2xs font-extrabold text-slate-800 hover:text-[#00B4C8] pt-1 block">
                    + Show More
                  </button>
                </div>
              )}
            </div>

            {/* ACCORDION 3: SELECT MATERIAL */}
            <div>
              <button
                onClick={() => toggleAccordion('material')}
                className="w-full bg-[#F1F3F5] px-4 py-2.5 text-xs font-extrabold text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Select Material</span>
                <span className="text-base font-bold text-slate-600">{openAccordions['material'] ? '−' : '+'}</span>
              </button>
              {openAccordions['material'] && (
                <div className="pt-3 px-1 space-y-2.5 text-xs">
                  {['German steel, 420', 'German steel, 440A', '316L stainless', 'Tungsten carbide insert'].map((mat) => {
                    const isChecked = selectedMaterials.includes(mat);
                    return (
                      <label key={mat} className="flex items-center text-slate-700 hover:text-slate-900 cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter(selectedMaterials, setSelectedMaterials, mat)}
                            className="w-4 h-4 rounded-none border-slate-300 text-[#00B4C8] focus:ring-[#00B4C8] cursor-pointer"
                          />
                          <span className={isChecked ? 'font-bold text-slate-900' : ''}>{mat}</span>
                        </div>
                      </label>
                    );
                  })}
                  <button className="text-2xs font-extrabold text-slate-800 hover:text-[#00B4C8] pt-1 block">
                    + Show More
                  </button>
                </div>
              )}
            </div>

            {/* ACCORDION 4: SELECT SIZE */}
            <div>
              <button
                onClick={() => toggleAccordion('size')}
                className="w-full bg-[#F1F3F5] px-4 py-2.5 text-xs font-extrabold text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Select Size</span>
                <span className="text-base font-bold text-slate-600">{openAccordions['size'] ? '−' : '+'}</span>
              </button>
              {openAccordions['size'] && (
                <div className="pt-3 px-1 space-y-2.5 text-xs">
                  {['115mm (Fine)', '140mm - 168mm', '190mm - 200mm', 'Multi-piece Set'].map((sz) => {
                    const isChecked = selectedSizes.includes(sz);
                    return (
                      <label key={sz} className="flex items-center text-slate-700 hover:text-slate-900 cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleFilter(selectedSizes, setSelectedSizes, sz)}
                            className="w-4 h-4 rounded-none border-slate-300 text-[#00B4C8] focus:ring-[#00B4C8] cursor-pointer"
                          />
                          <span className={isChecked ? 'font-bold text-slate-900' : ''}>{sz}</span>
                        </div>
                      </label>
                    );
                  })}
                  <button className="text-2xs font-extrabold text-slate-800 hover:text-[#00B4C8] pt-1 block">
                    + Show More
                  </button>
                </div>
              )}
            </div>

            {/* ACCORDION 5: SELECT PRICE RANGE */}
            <div>
              <button
                onClick={() => toggleAccordion('price')}
                className="w-full bg-[#F1F3F5] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center justify-between transition-colors"
              >
                <span>Select Price</span>
                <span className="text-base font-bold text-slate-600">{openAccordions['price'] ? '−' : '+'}</span>
              </button>
              {openAccordions['price'] && (
                <div className="pt-3 px-1 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Max Price:</span>
                    <span className="text-[#00B4C8] font-bold font-mono text-sm">${maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="350"
                    step="5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#00B4C8] cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PRODUCTS CATALOG GRID: DYNAMIC ITEM COUNT HEADER & PRODUCT CARDS */}
          <div className="lg:col-span-9">
            {/* Right Header Toolbar: DYNAMIC Item Count Box + Per Row Density Selector + Sort Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                {/* DYNAMIC ITEM COUNT BOX: Recalculates dynamically based on selected filters! */}
                <div className="border border-slate-300 px-3 py-1.5 text-xs font-extrabold text-slate-900 bg-white">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'Item' : 'Items'}
                </div>

                {/* Per Row Density Selector (Matching Reference Image: Zero button backgrounds, pure bar color toggling) */}
                <div className="border border-slate-300 px-3.5 py-1.5 text-xs text-slate-500 bg-white flex items-center gap-3">
                  <span>Per Row</span>
                  <div className="flex items-center gap-2.5">
                    {/* 3 Columns Icon Button */}
                    <button
                      type="button"
                      onClick={() => setGridCols(3)}
                      className="p-0 bg-transparent flex items-center gap-[2.5px] cursor-pointer hover:opacity-80 transition-opacity"
                      title="3 Columns per row"
                    >
                      <span className={`w-[4px] h-[13px] rounded-[0.5px] ${gridCols === 3 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                      <span className={`w-[4px] h-[13px] rounded-[0.5px] ${gridCols === 3 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                      <span className={`w-[4px] h-[13px] rounded-[0.5px] ${gridCols === 3 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                    </button>

                    {/* 4 Columns Icon Button */}
                    <button
                      type="button"
                      onClick={() => setGridCols(4)}
                      className="p-0 bg-transparent flex items-center gap-[2px] cursor-pointer hover:opacity-80 transition-opacity"
                      title="4 Columns per row"
                    >
                      <span className={`w-[3px] h-[13px] rounded-[0.5px] ${gridCols === 4 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                      <span className={`w-[3px] h-[13px] rounded-[0.5px] ${gridCols === 4 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                      <span className={`w-[3px] h-[13px] rounded-[0.5px] ${gridCols === 4 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                      <span className={`w-[3px] h-[13px] rounded-[0.5px] ${gridCols === 4 ? 'bg-[#1E293B]' : 'bg-[#D1D5DB]'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Sort by</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-300 px-3 py-1.5 text-slate-900 focus:outline-none focus:border-[#00B4C8] cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="border border-dashed border-slate-300 p-12 text-center bg-slate-50">
                <p className="text-base font-bold text-slate-700 mb-2">No instruments found matching criteria</p>
                <p className="text-xs text-slate-500 mb-6">Try adjusting your selected specialties or instrument types.</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-[#00B4C8] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols === 4 ? 'lg:grid-cols-4 gap-4' : 'lg:grid-cols-3 gap-8'}`}>
                {filteredProducts.map((p) => {
                  const isWished = hasMounted ? wishlist.includes(p.id) : false;
                  const isAdded = addedItemIds[p.id];
                  const savingsAmount = p.compareAtPrice ? p.compareAtPrice - p.price : 0;
                  const savingsPct = p.compareAtPrice ? Math.round((savingsAmount / p.compareAtPrice) * 100) : 0;

                  return (
                    <div
                      key={p.id}
                      className="group/card bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                    >
                      {/* CARD IMAGE CONTAINER (Exact Match to Slider Cards on Home Page) */}
                      <div className="relative w-full aspect-square bg-[#F8F9FA] overflow-hidden flex items-center justify-center p-0">
                        {/* Circular Floating Wishlist Heart Button - REVEALED ON HOVER ONLY (Matching Slider) */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all opacity-0 group-hover/card:opacity-100 z-20"
                          title="Add to Wishlist"
                        >
                          <Heart size={16} fill={isWished ? '#F43F5E' : 'none'} className={isWished ? 'text-rose-500' : 'text-slate-600'} />
                        </button>

                        {/* Product Image - Full Width Zero Padding */}
                        <Link href={`/products/${p.id}`} className="block w-full h-full p-0">
                          <img
                            src={p.img}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                          />
                        </Link>
                      </div>

                      {/* CARD DETAILS - CENTER ALIGNED (Matching Slider Cards on Home Page) */}
                      <div className="p-5 flex-1 flex flex-col justify-between text-center">
                        <div>
                          {/* Title */}
                          <Link
                            href={`/products/${p.id}`}
                            className="block text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors line-clamp-1 mb-1"
                          >
                            {p.name}
                          </Link>

                          {/* Red Bold Price Row */}
                          <div className="mt-2">
                            {p.compareAtPrice ? (
                              <>
                                <div className="text-sm font-extrabold text-[#E11D48]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                  Now ${p.price.toFixed(2)}
                                </div>
                                <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                                  Was ${p.compareAtPrice.toFixed(2)} | Save ${savingsAmount.toFixed(2)} ({savingsPct}%)
                                </div>
                              </>
                            ) : (
                              <div className="text-sm font-extrabold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                                ${p.price.toFixed(2)}
                              </div>
                            )}
                          </div>

                          {/* Color Swatch Dots with Chevron Arrow (Matching Slider Cards) */}
                          {p.swatches && (
                            <div className="flex items-center justify-center gap-1.5 mt-3">
                              {p.swatches.map((sw, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 transition-transform hover:scale-125 cursor-pointer"
                                  style={{ backgroundColor: sw.colorHex }}
                                  title={sw.name}
                                />
                              ))}
                              <ChevronRight size={14} className="text-slate-400 ml-1" />
                            </div>
                          )}
                        </div>

                        {/* Action Button: ADD TO CART - REVEALED ON HOVER ONLY (Matching Slider Cards) */}
                        <div className="mt-4 pt-2 min-h-[44px] flex items-center justify-center">
                          <button
                            onClick={() => handleAddToCart(p)}
                            className={`w-full py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs opacity-0 group-hover/card:opacity-100 ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-[#00B4C8] text-white'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check size={14} /> Added
                              </>
                            ) : (
                              <>
                                <ShoppingCart size={13} /> Add to Cart
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductCatalogView(props: ProductCatalogViewProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white py-20 text-center text-xs font-mono text-slate-400">Loading surgical instruments catalog...</div>}>
      <ProductCatalogContent {...props} />
    </Suspense>
  );
}
