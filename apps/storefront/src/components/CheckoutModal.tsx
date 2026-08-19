'use client';

import { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, CreditCard, Building2, Truck, Send } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';
import api from '../lib/api';

const T = '#00B4C8';
const N = '#1A2B4A';

interface CheckoutModalProps {
  onClose: () => void;
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const hasMounted = useHasMounted();
  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);

  if (!hasMounted) return null;

  const [formData, setFormData] = useState({
    name: 'Dr. Sarah Jenkins',
    email: 'sarah.jenkins@hospital.org',
    phone: '+1 555-234-5678',
    company: 'St. Jude General Hospital',
    address: '450 Medical Center Blvd',
    city: 'New York',
    postalCode: '10016',
    country: 'United States',
    paymentMethod: 'invoice',
    notes: 'Please include certificate of origin and sterilisation batch certificates.',
  });

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal >= 150 ? 0 : 15;
  const total = subtotal + shipping;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const orderPayload = {
        customer_email: formData.email,
        customer_name: formData.name,
        shipping_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        billing_address: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
        payment_method: formData.paymentMethod,
        notes: `Company: ${formData.company}\nPhone: ${formData.phone}\nNotes: ${formData.notes}`,
        items: cart.map((c) => ({
          product_id: Number(c.id.replace(/[^0-9]/g, '')) || 1,
          sku: c.sku || c.id,
          unit_price: c.price,
          quantity: c.qty,
        })),
      };

      const { data } = await api.post('/orders/public-checkout', orderPayload);
      const createdOrder = data?.data || { order_number: 'ORD-98471' };

      setSuccessOrder(createdOrder);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-white flex-shrink-0" style={{ backgroundColor: N }}>
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Checkout — Complete Purchase
            </h2>
            <p className="text-2xs text-slate-300">ISO 13485 Certified Medical Procurement</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-300 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {successOrder ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Order Placed Successfully!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for your order. Your official reference number is{' '}
                <span className="font-mono font-bold text-indigo-600">{successOrder.order_number || successOrder.id || 'ORD-SUCCESS'}</span>. An itemized order confirmation &amp; invoice email has been sent to <span className="font-semibold text-slate-900">{formData.email}</span>.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl font-bold text-white text-xs shadow-md transition-opacity hover:opacity-90"
                  style={{ backgroundColor: T }}
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {errorMsg && (
                <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  {errorMsg}
                </div>
              )}

              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-[#E8F9FB] border border-[#D4EFF3] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Order Summary ({cart.reduce((a, b) => a + b.qty, 0)} Items)
                  </span>
                  <p className="text-2xs text-slate-500 mt-0.5">Includes international express dispatch</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-base text-slate-900" style={{ color: T, fontFamily: "'Montserrat', sans-serif" }}>
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  1. Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Phone / WhatsApp *
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Company / Hospital Name
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  2. Shipping Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Street Address *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Country *
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider mb-3 text-slate-800" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  3. Payment Method
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'invoice', label: 'Proforma Invoice', icon: <Building2 size={16} /> },
                    { id: 'card', label: 'Credit Card', icon: <CreditCard size={16} /> },
                    { id: 'cod', label: 'Wire Transfer', icon: <Truck size={16} /> },
                  ].map((pm) => (
                    <label
                      key={pm.id}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs font-semibold transition-all ${
                        formData.paymentMethod === pm.id
                          ? 'border-[#00B4C8] bg-[#E8F9FB] text-slate-900 shadow-sm'
                          : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={pm.id}
                        checked={formData.paymentMethod === pm.id}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="accent-[#00B4C8]"
                      />
                      {pm.icon}
                      <span>{pm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full py-3.5 rounded-xl font-bold text-white text-xs transition-all hover:opacity-90 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: N }}
              >
                <Send size={15} />
                {loading ? 'Processing Order…' : `Confirm & Place Order ($${total.toFixed(2)})`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
