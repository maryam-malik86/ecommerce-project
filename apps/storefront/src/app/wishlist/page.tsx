'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCartStore } from '../../lib/cartStore';
import { useHasMounted } from '../../lib/useHasMounted';
import { ChevronRight, Trash2, ShoppingCart, Plus, Minus, X, Check } from 'lucide-react';

const MOCK_WISHLIST_PRODUCTS: Record<string, any> = {
  '1': {
    id: '1',
    name: 'Kelila Periodontal Scaler Set',
    category: 'Dental Instruments',
    price: 30.00,
    compareAtPrice: 89.95,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=400&fit=crop&auto=format',
    sizes: ['Set of 5', 'Set of 10', 'Full Tray'],
  },
  '2': {
    id: '2',
    name: 'Margaritaa Extraction Forceps',
    category: 'General Surgery',
    price: 55.00,
    compareAtPrice: 69.95,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=500&h=400&fit=crop&auto=format',
    sizes: ['Standard', 'Curved', 'Upper Molar'],
  },
  '3': {
    id: '3',
    name: 'Ollin Dissecting Scissors Hook Tip',
    category: 'General Surgery',
    price: 40.00,
    compareAtPrice: 79.95,
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=500&h=400&fit=crop&auto=format',
    sizes: ['115mm (Fine)', '140mm', '168mm'],
  },
  '4': {
    id: '4',
    name: 'Essana Hemostatic Clamp',
    category: 'Orthopedic',
    price: 45.00,
    compareAtPrice: 79.95,
    img: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&h=400&fit=crop&auto=format',
    sizes: ['14cm Straight', '14cm Curved', '18cm Long'],
  },
  'D-001': {
    id: 'D-001',
    name: 'Erinn Navy Patent Mocc Croc',
    category: 'Dental Instruments',
    price: 45.00,
    compareAtPrice: 65.00,
    img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=400&fit=crop&auto=format',
    sizes: ['UK 3 / EU 36', 'UK 4 / EU 37', 'UK 5 / EU 38'],
  },
  'SS-001': {
    id: 'SS-001',
    name: 'Ollin Dissecting Scissors Hook Tip',
    category: 'Surgical Scissors',
    price: 40.00,
    compareAtPrice: 79.95,
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=500&h=400&fit=crop&auto=format',
    sizes: ['115mm (Fine)', '140mm'],
  },
};

export default function WishlistPage() {
  const hasMounted = useHasMounted();
  const wishlistIds = useCartStore((s) => s.wishlist);
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addToCart);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const wishlistProducts = hasMounted
    ? wishlistIds.map((id) => MOCK_WISHLIST_PRODUCTS[id] || {
        id,
        name: `Surgical Instrument #${id}`,
        category: 'Medical Tools',
        price: 45.00,
        img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=500&h=400&fit=crop&auto=format',
        sizes: ['Standard', 'Set of 5'],
      })
    : [];

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleMoveToBag = (p: any) => {
    const qty = quantities[p.id] || 1;
    const size = selectedSizes[p.id] || p.sizes?.[0] || 'Standard';

    addToCart(
      {
        id: p.id,
        sku: `STC-${p.id}`,
        name: p.name,
        price: p.price,
        compareAt: p.compareAtPrice,
        image: p.img,
        category: p.category,
        size,
      },
      qty
    );

    setAddedItems((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [p.id]: false }));
    }, 1500);
  };

  const totalPrice = wishlistProducts.reduce((sum, p) => {
    const qty = quantities[p.id] || 1;
    return sum + p.price * qty;
  }, 0);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#00B4C8] selection:text-white" suppressHydrationWarning>
      <Navbar />

      {/* Top Banner Ticker Subhead */}
      <div className="bg-[#1A2B4A] text-white py-6 px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="max-w-[1440px] mx-auto">
          {/* Breadcrumb matching Screenshot 5: Home > My Wishlist */}
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
            <Link href="/" className="hover:text-[#00B4C8] transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-500" />
            <span className="text-[#00B4C8] font-semibold">My Wishlist</span>
          </div>

          <h1
            className="text-2xl sm:text-3xl font-serif text-white tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            My Wishlist
          </h1>
        </div>
      </div>

      {/* Main Wishlist Table Body (Matching Screenshot 5) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-12" suppressHydrationWarning>
        {wishlistProducts.length === 0 ? (
          <div className="py-16 text-center bg-white">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Your Wishlist is Empty</h2>
            <p className="text-xs text-slate-500 mb-6">Explore our OR-grade surgical tools and save your favorite items here.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-[#1A2B4A] hover:bg-[#00B4C8] text-white text-xs font-extrabold uppercase tracking-wider transition-colors"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Wishlist Items Table */}
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#F5F5F5] text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4 w-64">Product Description</th>
                  <th className="py-3.5 px-4 text-center">Quantity</th>
                  <th className="py-3.5 px-4 text-center">Price</th>
                  <th className="py-3.5 px-4 text-center">Buy</th>
                  <th className="py-3.5 px-4 text-center w-12">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {wishlistProducts.map((p) => {
                  const qty = quantities[p.id] || 1;
                  const isAdded = addedItems[p.id];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Product Description & Thumbnail */}
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-4">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-[#00B4C8] accent-[#00B4C8] cursor-pointer" />
                          <Link href={`/products/${p.id}`} className="w-16 h-16 bg-slate-100 flex-shrink-0 flex items-center justify-center p-1 border border-slate-200">
                            <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                          </Link>
                          <div>
                            <Link href={`/products/${p.id}`} className="font-semibold text-slate-800 hover:text-[#00B4C8] transition-colors block mb-1.5">
                              {p.name}
                            </Link>
                            {p.sizes && p.sizes.length > 0 && (
                              <select
                                value={selectedSizes[p.id] || p.sizes[0]}
                                onChange={(e) => setSelectedSizes((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                className="text-xs bg-white border border-slate-300 px-2 py-1 text-slate-700 focus:outline-none focus:border-[#00B4C8]"
                              >
                                {p.sizes.map((s: string) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quantity Selector Spinner (- 1 +) */}
                      <td className="py-5 px-4 text-center">
                        <div className="inline-flex items-center border border-slate-300 bg-white">
                          <input
                            type="text"
                            readOnly
                            value={qty}
                            className="w-10 text-center text-xs font-bold text-slate-800 focus:outline-none"
                          />
                          <div className="flex flex-col border-l border-slate-300">
                            <button
                              type="button"
                              onClick={() => handleQtyChange(p.id, 1)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-b border-slate-200 text-3xs font-extrabold"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQtyChange(p.id, -1)}
                              className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-3xs font-extrabold"
                            >
                              −
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-5 px-4 text-center font-semibold text-slate-800">
                        ${(p.price * qty).toFixed(2)}
                      </td>

                      {/* Buy Button (ADD TO MY BAG) */}
                      <td className="py-5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleMoveToBag(p)}
                          className={`px-5 py-2.5 text-2xs font-extrabold uppercase tracking-wider transition-all shadow-xs ${
                            isAdded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#6B7280] hover:bg-[#00B4C8] text-white'
                          }`}
                        >
                          {isAdded ? (
                            <span className="flex items-center justify-center gap-1">
                              <Check size={13} /> Added
                            </span>
                          ) : (
                            'ADD TO MY BAG'
                          )}
                        </button>
                      </td>

                      {/* Remove Button */}
                      <td className="py-5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p.id)}
                          className="w-6 h-6 border border-slate-300 hover:border-rose-500 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors mx-auto"
                          title="Remove from Wishlist"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom Row: Total Price Summary */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end items-center gap-4 text-sm font-bold text-slate-800">
              <span>Total Price</span>
              <span className="text-lg font-extrabold text-[#00B4C8] font-mono">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
