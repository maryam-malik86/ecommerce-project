'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingCart, ArrowRight } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';
import api from '../lib/api';

const T = '#00B4C8';
const N = '#1A2B4A';

const MOCK_COLLECTION = [
  {
    id: '1',
    name: 'Kelila Periodontal Scaler Set',
    category: 'Dental Instruments',
    price: 30,
    wasPrice: 89.95,
    saveText: 'Save $59.95 (67%)',
    rating: 5,
    reviews: 1,
    badge: 'SALE',
    ribbon: 'GERMAN STEEL',
    sizes: ['Set of 5', 'Set of 10', 'Full Tray'],
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=400&fit=crop&auto=format',
    swatches: ['#00B4C8', '#1A2B4A'],
  },
  {
    id: '2',
    name: 'Margaritaa Extraction Forceps',
    category: 'Dental Instruments',
    price: 55,
    wasPrice: 69.95,
    saveText: 'Save $14.95 (21%)',
    rating: 5,
    reviews: 4,
    badge: 'SALE',
    ribbon: 'OR GRADE',
    sizes: ['Standard', 'Curved', 'Upper Molar'],
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=500&h=400&fit=crop&auto=format',
    swatches: ['#E11D48', '#00B4C8'],
  },
  {
    id: '3',
    name: 'Ollin Dissecting Scissors',
    category: 'Surgical Scissors',
    price: 40,
    wasPrice: 79.95,
    saveText: 'Save $39.95 (50%)',
    rating: 5,
    reviews: 12,
    badge: 'SALE',
    ribbon: 'MODA FOAM',
    sizes: ['UK 4 / EU 37', 'UK 5 / EU 38', 'UK 7 / EU 40'],
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&h=400&fit=crop&auto=format',
    swatches: ['#F59E0B', '#374151', '#D1D5DB'],
  },
  {
    id: '4',
    name: 'Essana Hemostatic Clamp',
    category: 'Forceps & Clamps',
    price: 45,
    wasPrice: 79.95,
    saveText: 'Save $34.95 (44%)',
    rating: 4,
    reviews: 1,
    badge: 'SALE',
    ribbon: 'MODA FOAM',
    sizes: ['14cm Straight', '14cm Curved', '18cm Long'],
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=400&fit=crop&auto=format',
    swatches: ['#1E293B', '#F59E0B'],
  },
  {
    id: '5',
    name: 'Flissie Orthopedic Retractor',
    category: 'Orthopedic Sets',
    price: 60,
    wasPrice: 89.95,
    saveText: 'Save $29.95 (33%)',
    rating: 5,
    reviews: 8,
    badge: 'SALE',
    ribbon: 'MODA FOAM',
    sizes: ['Small Blade', 'Medium Blade', 'Large Blade'],
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=500&h=400&fit=crop&auto=format',
    swatches: ['#CBD5E1', '#00B4C8', '#1E293B'],
  },
  {
    id: '6',
    name: 'Sinus Lift Implant Placement Kit',
    category: 'Implant Kits',
    price: 120,
    wasPrice: 160.00,
    saveText: 'Save $40.00 (25%)',
    rating: 5,
    reviews: 15,
    badge: 'NEW IN',
    ribbon: 'TITANIUM',
    sizes: ['Complete Kit', 'Refill Pack'],
    img: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=500&h=400&fit=crop&auto=format',
    swatches: ['#00B4C8', '#475569'],
  },
];

interface ShopCatalogProps {
  selectedCategory?: string;
  searchQuery?: string;
}

export default function ShopCatalog({ selectedCategory = 'All', searchQuery = '' }: ShopCatalogProps) {
  const hasMounted = useHasMounted();
  const [collections, setCollections] = useState<any[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(null);
  const [products, setProducts] = useState<any[]>(MOCK_COLLECTION);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const addToCart = useCartStore((s) => s.addToCart);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const wishlist = useCartStore((s) => s.wishlist);

  // 1. Fetch collections from backend API
  useEffect(() => {
    async function loadCollections() {
      try {
        const { data } = await api.get('/catalog/collections');
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          setCollections(data.data);
          setActiveCollectionId(data.data[0].id);
        } else {
          // Default collection tabs fallback
          setCollections([
            { id: 1, name: 'Shop Sale', slug: 'shop-sale' },
            { id: 2, name: 'New In', slug: 'new-in' },
            { id: 3, name: 'Moda Must Haves', slug: 'moda-must-haves' },
          ]);
          setActiveCollectionId(1);
        }
      } catch (err) {
        setCollections([
          { id: 1, name: 'Shop Sale', slug: 'shop-sale' },
          { id: 2, name: 'New In', slug: 'new-in' },
          { id: 3, name: 'Moda Must Haves', slug: 'moda-must-haves' },
        ]);
        setActiveCollectionId(1);
      }
    }
    loadCollections();
  }, []);

  // 2. Fetch products for active collection
  useEffect(() => {
    async function loadProductsForCollection() {
      try {
        const url = activeCollectionId
          ? `/catalog/products?collection_id=${activeCollectionId}&limit=20`
          : '/catalog/products?limit=20';
        const { data } = await api.get(url);
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((p: any, idx: number) => {
            const variant = p.variants?.[0] || {};
            const price = Number(variant.selling_price || p.price_from || 40);
            const wasPrice = variant.compare_at_price ? Number(variant.compare_at_price) : Math.round(price * 1.4);
            const diff = wasPrice - price;
            const pct = Math.round((diff / wasPrice) * 100);

            return {
              id: String(p.id),
              name: p.name,
              category: p.primary_category || 'Surgical Instruments',
              price,
              wasPrice,
              saveText: `Save $${diff.toFixed(2)} (${pct}%)`,
              rating: 5,
              reviews: 1 + (idx * 3) % 15,
              badge: 'SALE',
              ribbon: idx % 2 === 0 ? 'MODA FOAM' : 'GERMAN STEEL',
              sizes: ['Standard Size', 'Set of 5', 'Set of 10'],
              img: variant.image_url || p.image_url || MOCK_COLLECTION[idx % MOCK_COLLECTION.length]?.img,
              swatches: ['#00B4C8', '#1A2B4A', '#F59E0B'],
            };
          });
          setProducts(mapped);
        } else {
          setProducts(MOCK_COLLECTION);
        }
      } catch (err) {
        setProducts(MOCK_COLLECTION);
      }
    }

    loadProductsForCollection();
  }, [activeCollectionId]);

  // Default Auto-Sliding Interval
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          // Loop back to start smoothly
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused]);

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="shop-catalog" className="py-20 bg-white border-t border-b border-slate-100 selection:bg-[#00B4C8] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        {/* Centered Section Title */}
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-serif text-slate-800 tracking-wide mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Browse Our Collections
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Discover our stunning collection of OR-grade surgical and dental instruments, designed with care and crafted with high-grade German stainless steel for ultimate precision.
          </p>

          {/* Centered Dynamic Collection Tabs */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mt-8 border-b border-slate-200 pb-3 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar max-w-full">
            {collections.map((col, idx) => (
              <div key={col.id} className="flex items-center gap-4 sm:gap-8 flex-shrink-0">
                <button
                  onClick={() => setActiveCollectionId(col.id)}
                  className={`whitespace-nowrap transition-colors pb-1.5 ${
                    activeCollectionId === col.id
                      ? 'border-b-2 border-[#00B4C8] text-[#00B4C8] font-extrabold'
                      : 'text-slate-500 hover:text-[#00B4C8]'
                  }`}
                >
                  {col.name}
                </button>
                {idx < collections.length - 1 && <span className="text-slate-300 flex-shrink-0">|</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Slider Container with Auto-Slide Pause on Mouse Hover */}
        <div
          className="relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Left Arrow Button */}
          <button
            onClick={() => scrollSlider('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-[#00B4C8] transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous Slide"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Right Arrow Button */}
          <button
            onClick={() => scrollSlider('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-[#00B4C8] transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next Slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Equal Container Width/Height Product Slider Row */}
          <div
            ref={sliderRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-6 pt-2 no-scrollbar scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((p) => {
              const isWished = hasMounted ? wishlist.includes(p.id) : false;
              return (
                <div
                  key={p.id}
                  className="flex-shrink-0 w-64 sm:w-72 bg-white group/card flex flex-col justify-between transition-all hover:shadow-xl relative overflow-hidden"
                >
                  {/* Square Image Container with Zero Padding */}
                  <div className="relative w-full h-64 bg-slate-100 overflow-hidden flex items-center justify-center p-0">
                    <a href={`/products/${p.id}`} className="block w-full h-full">
                      <img
                        src={p.img}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                      />
                    </a>

                    {/* Circular Floating Wishlist Heart Button - Revealed on Hover */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all opacity-0 group-hover/card:opacity-100 z-20"
                      title="Add to Wishlist"
                    >
                      <Heart size={16} fill={isWished ? '#F43F5E' : 'none'} className={isWished ? 'text-rose-500' : 'text-slate-600'} />
                    </button>
                  </div>

                  {/* Product Details Section (Centered layout) */}
                  <div className="text-center p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <a
                        href={`/products/${p.id}`}
                        className="text-xs text-slate-700 hover:text-slate-900 line-clamp-1 block transition-colors font-medium mb-1"
                      >
                        {p.name}
                      </a>

                      {/* Red Bold Price Row */}
                      <div className="mt-2">
                        <div className="text-sm font-extrabold text-[#E11D48]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          Now ${p.price.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                          Was ${p.wasPrice.toFixed(2)} | {p.saveText}
                        </div>
                      </div>

                      {/* Swatches & Arrow Row */}
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        {p.swatches.map((color: string, i: number) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-slate-300 transition-transform hover:scale-125 cursor-pointer"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <ChevronRight size={14} className="text-slate-400 ml-1" />
                      </div>
                    </div>

                    {/* Action Button: Add to Cart - Revealed on Hover ONLY */}
                    <div className="mt-4 pt-2 min-h-[44px] flex items-center justify-center">
                      <button
                        onClick={() =>
                          addToCart({
                            id: p.id,
                            sku: `NS-${p.id}`,
                            name: p.name,
                            price: p.price,
                            image: p.img,
                            category: p.category,
                            size: p.sizes[0] || 'Standard',
                          })
                        }
                        className="w-full py-2.5 bg-slate-900 hover:bg-[#00B4C8] text-white text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs opacity-0 group-hover/card:opacity-100"
                      >
                        <ShoppingCart size={13} />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
