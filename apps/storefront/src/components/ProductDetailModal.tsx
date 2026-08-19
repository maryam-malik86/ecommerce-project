'use client';

import { useState } from 'react';
import { X, Star, ShieldCheck, Check, ShoppingCart, Plus, Minus, Heart, Award, Sparkles } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';

const T = '#00B4C8';
const N = '#1A2B4A';

interface ProductDetailModalProps {
  product: any;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const hasMounted = useHasMounted();
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'Standard');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'features'>('desc');

  const addToCart = useCartStore((s) => s.addToCart);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const wishlist = useCartStore((s) => s.wishlist);

  if (!product) return null;

  const isWished = hasMounted ? wishlist.includes(product.id) : false;

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        variantId: product.variantId,
        name: product.name,
        sku: product.sku || product.id,
        price: product.price,
        compareAt: product.compareAt,
        image: product.img || product.image_url,
        category: product.category,
        size: selectedSize,
      },
      qty
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            SKU: {product.sku || product.id} &middot; {product.category}
          </span>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image & Thumbnails */}
          <div className="space-y-4">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
              <img
                src={product.img || product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span
                  className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md"
                  style={{ backgroundColor: T }}
                >
                  {product.badge}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:border-[#00B4C8] transition-colors"
                >
                  <img src={product.img || product.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Details & Selectors */}
          <div className="flex flex-col space-y-4">
            <div>
              <h2
                className="text-xl font-bold text-slate-900 leading-snug mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {product.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {product.rating || '4.8'} ({product.reviews || '120'} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-slate-900" style={{ color: T, fontFamily: "'Montserrat', sans-serif" }}>
                ${Number(product.price).toFixed(2)}
              </span>
              {product.compareAt && (
                <span className="text-sm text-slate-400 line-through">
                  ${Number(product.compareAt).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Select Size / Specification:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        selectedSize === s
                          ? 'border-[#00B4C8] bg-[#E8F9FB] text-slate-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper & Add to Cart */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-xs font-bold text-slate-900">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-slate-900"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-3 rounded-xl font-bold text-white text-xs transition-all hover:opacity-90 shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: N }}
              >
                <ShoppingCart size={15} />
                Add to Cart
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 rounded-xl border transition-colors ${
                  isWished ? 'border-rose-200 bg-rose-50 text-rose-500' : 'border-slate-200 text-slate-400 hover:text-slate-700'
                }`}
              >
                <Heart size={16} fill={isWished ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
