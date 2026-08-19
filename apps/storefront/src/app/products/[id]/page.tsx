'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  Award,
  CheckCircle2,
  ShoppingCart,
  Heart,
  ArrowRight,
  Plus,
  Minus,
  FileText,
  Clock,
  RotateCcw,
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import AuthModal from '../../../components/AuthModal';
import CartDrawer from '../../../components/CartDrawer';
import { useCartStore } from '../../../lib/cartStore';
import { useHasMounted } from '../../../lib/useHasMounted';
import api from '../../../lib/api';

const T = '#00B4C8';
const N = '#1A2B4A';

const MOCK_PRODUCTS: Record<string, any> = {
  '1': {
    id: '1',
    sku: 'NS-D-001',
    name: 'Universal Periodontal Scaler Set (5-Piece)',
    category: 'Dental Instruments',
    price: 68,
    compareAtPrice: 85,
    rating: 4.9,
    reviewsCount: 38,
    inStock: true,
    stockQuantity: 46,
    badge: 'Best Seller',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Precision-ground universal periodontal scalers forged from medical-grade German stainless steel. Engineered specifically for supra- and subgingival calculus removal with double-ended anatomical handles and non-slip knurled grip.',
    specs: [
      { label: 'Material', value: 'German Stainless Steel (AISI 420)' },
      { label: 'Grade', value: 'OR Grade / 100% Autoclavable' },
      { label: 'Certification', value: 'ISO 13485 & CE Certified' },
      { label: 'Finish', value: 'Satin Anti-Glare Finish' },
      { label: 'Warranty', value: 'Lifetime Guarantee Against Corrosion' },
    ],
  },
  '2': {
    id: '2',
    sku: 'NS-D-002',
    name: 'Dental Extraction Forceps — Upper Universal',
    category: 'Dental Instruments',
    price: 54,
    compareAtPrice: 70,
    rating: 4.8,
    reviewsCount: 24,
    inStock: true,
    stockQuantity: 38,
    badge: 'CE Certified',
    image: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
    photos: [
      'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
    ],
    description:
      'Anatomically curved upper universal extraction forceps designed for atraumatic tooth removal. Features micro-serrated beaks for maximum tactile control and zero slip during elevation.',
    specs: [
      { label: 'Material', value: 'German Stainless Steel (AISI 440C)' },
      { label: 'Grade', value: 'Surgical OR Grade' },
      { label: 'Certification', value: 'ISO 13485 & FDA Compliant' },
      { label: 'Warranty', value: 'Lifetime Guarantee' },
    ],
  },
};

export default function ProductDetailPage({ params }: { params: any }) {
  const initialId = typeof params?.id === 'string' ? params.id : '';
  const [productId, setProductId] = useState<string>(initialId);

  useEffect(() => {
    if (params && typeof params.then === 'function') {
      params.then((res: any) => setProductId(res?.id || ''));
    } else if (params?.id) {
      setProductId(params.id);
    }
  }, [params]);

  const hasMounted = useHasMounted();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [selectedSize, setSelectedSize] = useState<string>('Standard Set');
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'sterilization'>('overview');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const addToCart = useCartStore((s) => s.addToCart);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const wishlist = useCartStore((s) => s.wishlist);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      try {
        const { data } = await api.get(`/catalog/products?limit=50`);
        const allProds = data?.data || [];
        const found = allProds.find((p: any) => String(p.id) === String(productId) || p.slug === productId);

        if (found) {
          const variant = found.variants?.[0] || {};
          const pData = {
            id: String(found.id),
            sku: variant.sku || found.sku || `NS-${found.id}`,
            name: found.name,
            category: found.primary_category || 'Medical Instruments',
            price: Number(variant.selling_price || found.price_from || 45),
            compareAtPrice: variant.compare_at_price ? Number(variant.compare_at_price) : Math.round(Number(variant.selling_price || 45) * 1.25),
            rating: 4.9,
            reviewsCount: 28 + (found.id * 7) % 50,
            inStock: Number(variant.stock_quantity ?? 30) > 0,
            stockQuantity: Number(variant.stock_quantity ?? 30),
            badge: 'ISO 13485 Certified',
            image: variant.image_url || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
            photos: [
              variant.image_url || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&auto=format&fit=crop&q=80',
            ],
            description: found.description || 'Precision surgical instrument forged from medical-grade German stainless steel.',
            specs: [
              { label: 'Material', value: 'German Stainless Steel (AISI 420 / 440)' },
              { label: 'Grade', value: 'OR Grade / 100% Autoclavable' },
              { label: 'Certification', value: 'ISO 13485 & CE Certified' },
              { label: 'Finish', value: 'Satin Anti-Glare Finish' },
              { label: 'Warranty', value: 'Lifetime Guarantee Against Corrosion' },
            ],
          };
          setProduct(pData);
          setActiveImg(pData.image);

          // Map related products
          const related = allProds
            .filter((p: any) => String(p.id) !== String(found.id))
            .slice(0, 4)
            .map((p: any) => ({
              id: String(p.id),
              name: p.name,
              category: p.primary_category || 'Surgical Instruments',
              price: Number(p.variants?.[0]?.selling_price || p.price_from || 45),
              image: p.variants?.[0]?.image_url || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&auto=format&fit=crop&q=80',
            }));
          setRelatedProducts(related);
        } else {
          // Fallback to mock product
          const fallback = MOCK_PRODUCTS[productId] || MOCK_PRODUCTS['1'];
          setProduct(fallback);
          setActiveImg(fallback.image);
        }
      } catch (err) {
        const fallback = MOCK_PRODUCTS[productId] || MOCK_PRODUCTS['1'];
        setProduct(fallback);
        setActiveImg(fallback.image);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#00B4C8] border-t-transparent animate-spin rounded-full" />
            <p className="text-xs font-semibold text-slate-500">Loading Product Details…</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isWished = hasMounted ? wishlist.includes(product.id) : false;

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        sku: product.sku || `NS-${product.id}`,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        size: selectedSize,
      },
      qty
    );
    setCartOpen(true);
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        sku: product.sku || `NS-${product.id}`,
        name: product.name,
        category: product.category,
        price: product.price,
        image: product.image,
        size: selectedSize,
      },
      qty
    );
    window.location.href = '/checkout';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <AuthModal />
      <CartDrawer />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#00B4C8] transition-colors">Home</Link>
          <ChevronRight size={12} className="text-slate-400" />
          <Link href="/#shop-catalog" className="hover:text-[#00B4C8] transition-colors">Catalog</Link>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-700 font-semibold truncate">{product.category}</span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <main className="flex-1 py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
          <div className="bg-white border border-slate-200 p-6 md:p-10 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Gallery */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              {/* Main Display Image */}
              <div className="relative aspect-4/3 bg-slate-100 border border-slate-200 overflow-hidden group">
                <img
                  src={activeImg || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 bg-[#1A2B4A] text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                  {product.badge || 'CE Certified'}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors"
                >
                  <Heart size={18} fill={isWished ? '#F43F5E' : 'none'} className={isWished ? 'text-rose-500' : ''} />
                </button>
              </div>

              {/* Thumbnails List */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                {(product.photos || [product.image]).map((imgUrl: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImg(imgUrl)}
                    className={`w-20 h-20 border-2 overflow-hidden flex-shrink-0 transition-all ${
                      activeImg === imgUrl ? 'border-[#00B4C8] shadow-sm' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 flex flex-col items-center gap-1.5">
                  <ShieldCheck size={20} className="text-[#00B4C8]" />
                  <span className="text-[11px] font-bold text-slate-800">ISO 13485 Certified</span>
                  <span className="text-[9px] text-slate-500">German Steel Grade</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 flex flex-col items-center gap-1.5">
                  <Truck size={20} className="text-[#00B4C8]" />
                  <span className="text-[11px] font-bold text-slate-800">Express Shipping</span>
                  <span className="text-[9px] text-slate-500">Free over $150</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 flex flex-col items-center gap-1.5">
                  <Award size={20} className="text-[#00B4C8]" />
                  <span className="text-[11px] font-bold text-slate-800">Lifetime Warranty</span>
                  <span className="text-[9px] text-slate-500">Against Rust</span>
                </div>
              </div>
            </div>

            {/* Right Column: Information & Actions */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00B4C8]">
                    {product.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">SKU: {product.sku}</span>
                </div>

                <h1
                  className="text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight mb-3"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {product.name}
                </h1>

                {/* Rating & In-Stock */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill="#F59E0B" className="text-amber-500" />
                    ))}
                    <span className="text-xs font-bold text-slate-800 ml-1.5">{product.rating}</span>
                    <span className="text-xs text-slate-400">({product.reviewsCount} reviews)</span>
                  </div>
                  <span className="h-4 w-px bg-slate-200" />
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock ({product.stockQuantity} available)
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 mb-6 bg-[#E8F9FB] p-4 border border-[#BCE8EF]">
                  <span className="text-3xl font-extrabold text-slate-900" style={{ color: N, fontFamily: "'Montserrat', sans-serif" }}>
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-base text-slate-400 line-through font-medium">
                      ${Number(product.compareAtPrice).toFixed(2)}
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                      Save ${(product.compareAtPrice - product.price).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Summary Description */}
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  {product.description}
                </p>

                {/* Spec Selection */}
                <div className="mb-6 space-y-2">
                  <label className="text-xs font-bold text-slate-900 block">Select Set / Size:</label>
                  <div className="flex flex-wrap gap-2">
                    {['Standard Set', 'Set of 5', 'Set of 10'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 text-xs font-semibold border transition-all ${
                          selectedSize === sz
                            ? 'border-[#00B4C8] bg-[#E8F9FB] text-[#00B4C8] font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & CTA Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4">
                    <label className="text-xs font-bold text-slate-900">Quantity:</label>
                    <div className="flex items-center border border-slate-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center text-xs font-bold text-slate-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(qty + 1)}
                        className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="py-3.5 px-6 font-bold text-xs uppercase tracking-wider text-white shadow-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                      style={{ backgroundColor: T }}
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="py-3.5 px-6 font-bold text-xs uppercase tracking-wider text-white shadow-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                      style={{ backgroundColor: N }}
                    >
                      Buy Now &amp; Checkout
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Information & Specifications Section */}
          <div className="mt-10 bg-white border border-slate-200 p-6 md:p-10 shadow-xs">
            <div className="flex border-b border-slate-200 gap-8 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'overview' ? 'border-[#00B4C8] text-[#00B4C8]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Full Overview &amp; Features
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'specs' ? 'border-[#00B4C8] text-[#00B4C8]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Technical Specifications
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sterilization')}
                className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === 'sterilization' ? 'border-[#00B4C8] text-[#00B4C8]' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sterilization &amp; Care
              </button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
                <p>
                  StoreCo Surgical instruments are manufactured with utmost precision in Sialkot, Pakistan using premium German stainless steel grades (AISI 420 / AISI 440C). Each instrument undergoes rigorous metallurgical testing, heat treatment, and ultrasonic cleaning before final inspection.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 font-medium text-slate-700">
                  <li>Double-ended ergonomic handle with non-slip knurled grip pattern.</li>
                  <li>Laser-etched markings with permanent SKU traceability and UDI barcodes.</li>
                  <li>Ultra-fine hand-ground working ends for atraumatic soft tissue handling.</li>
                  <li>Resistant to pitting, staining, and chemical corrosion during autoclave cycles.</li>
                </ul>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody>
                    {product.specs.map((sp: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="py-3 px-4 font-bold text-slate-800 w-1/3 border-b border-slate-200">{sp.label}</td>
                        <td className="py-3 px-4 text-slate-600 border-b border-slate-200">{sp.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'sterilization' && (
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800">Autoclave &amp; Cleaning Instructions:</p>
                <ol className="list-decimal pl-5 space-y-1.5">
                  <li>Rinse immediately after surgical use with deionized or distilled water to remove blood and debris.</li>
                  <li>Ultrasonic clean for 10–15 minutes using neutral pH enzymatic disinfectant solution (pH 7.0–8.5).</li>
                  <li>Autoclave steam sterilize at 134°C (273°F) for a minimum 4-minute holding cycle.</li>
                  <li>Store in dry, temperature-controlled sterile instrument trays.</li>
                </ol>
              </div>
            )}
          </div>

          {/* SIMILAR PRODUCTS / RELATED INSTRUMENTS SECTION */}
          <div className="mt-14">
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#00B4C8]">Recommended</span>
                <h2 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Similar Surgical &amp; Dental Instruments
                </h2>
              </div>
              <Link href="/#shop-catalog" className="text-xs font-bold text-[#00B4C8] hover:underline flex items-center gap-1">
                View Full Catalog <ChevronRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <div
                  key={rp.id}
                  className="group bg-white border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={rp.image}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 bg-[#1A2B4A] text-white text-[9px] font-bold px-2 py-0.5 uppercase">
                      OR Grade
                    </span>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-[#00B4C8] mb-1">{rp.category}</p>
                      <h3 className="font-bold text-xs text-slate-900 line-clamp-2 mb-2 leading-snug">
                        {rp.name}
                      </h3>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900" style={{ color: N }}>
                        ${rp.price.toFixed(2)}
                      </span>
                      <Link
                        href={`/products/${rp.id}`}
                        className="px-3 py-1.5 text-[11px] font-bold text-white uppercase tracking-wider transition-opacity hover:opacity-90"
                        style={{ backgroundColor: T }}
                      >
                        View Product
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
