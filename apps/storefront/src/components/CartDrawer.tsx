'use client';

import { useState } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';
import CheckoutModal from './CheckoutModal';

const T = '#00B4C8';
const N = '#1A2B4A';
const FREE_SHIPPING_THRESHOLD = 150;

export default function CartDrawer() {
  const hasMounted = useHasMounted();
  const cartOpen = useCartStore((s) => s.cartOpen);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const cart = useCartStore((s) => s.cart);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeFromCart = useCartStore((s) => s.removeFromCart);
  const clearCart = useCartStore((s) => s.clearCart);

  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (!hasMounted || !cartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity z-50"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300">
        {/* Header */}
        <div className="px-6 h-16 border-b border-slate-100 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: N }}>
          <div className="flex items-center gap-2.5 text-white">
            <ShoppingCart size={18} style={{ color: T }} />
            <h2 className="font-bold text-sm tracking-wide" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Your Cart ({totalItems})
            </h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        <div className="bg-[#E8F9FB] px-6 py-3 border-b border-[#D4EFF3]">
          <div className="flex items-center justify-between text-2xs font-semibold mb-1.5" style={{ color: N }}>
            <span className="flex items-center gap-1.5">
              <Truck size={13} style={{ color: T }} />
              {amountNeededForFreeShipping === 0
                ? '🎉 You unlocked Free Express Shipping!'
                : `Add $${amountNeededForFreeShipping.toFixed(2)} more for Free Shipping`}
            </span>
            <span>{freeShippingProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{ width: `${freeShippingProgress}%`, backgroundColor: T }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <ShoppingCart size={28} />
              </div>
              <h3 className="font-bold text-slate-800 text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Your cart is empty
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Explore our catalog of ISO-certified surgical &amp; dental instruments to get started.
              </p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: T }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="flex gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover bg-slate-200 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: T }}>
                    {item.category}
                  </p>
                  <h4
                    className="font-bold text-xs text-slate-900 truncate leading-snug"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {item.name}
                  </h4>
                  <p className="text-2xs text-slate-400 mt-0.5">Size / Spec: {item.size}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => updateQty(item.id, item.size, item.qty - 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.size, item.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id, item.size)}
                        className="text-slate-400 hover:text-rose-500 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-white space-y-3.5 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                ${subtotal.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Shipping</span>
              <span className="font-semibold text-emerald-600">
                {subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : '$15.00'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-900">Total</span>
              <span className="font-extrabold text-base text-slate-900" style={{ color: T, fontFamily: "'Montserrat', sans-serif" }}>
                ${(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 15)).toFixed(2)}
              </span>
            </div>

            <a
              href="/checkout"
              onClick={() => setCartOpen(false)}
              className="w-full py-3.5 font-bold text-white text-xs uppercase tracking-wider transition-all hover:opacity-90 shadow-md flex items-center justify-center gap-2"
              style={{ backgroundColor: N }}
            >
              Proceed to Checkout
              <ArrowRight size={15} />
            </a>

            <p className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              256-Bit SSL Encrypted &amp; ISO 13485 Certified Purchase
            </p>
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  );
}
