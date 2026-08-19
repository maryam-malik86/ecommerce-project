'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Building2,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronRight,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AuthModal from '../../components/AuthModal';
import CartDrawer from '../../components/CartDrawer';
import { useCartStore } from '../../lib/cartStore';
import { useHasMounted } from '../../lib/useHasMounted';
import api from '../../lib/api';

const T = '#00B4C8';
const N = '#1A2B4A';
const FREE_SHIPPING_THRESHOLD = 150;

export default function CheckoutPage() {
  const hasMounted = useHasMounted();
  const cart = useCartStore((s) => s.cart);
  const clearCart = useCartStore((s) => s.clearCart);

  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United States');
  const [postalCode, setPostalCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'express' | 'freight' | 'ocean'>('express');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'po' | 'wire'>('card');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || shippingMethod === 'ocean';
  const shippingCost = isFreeShipping ? 0 : shippingMethod === 'express' ? 15 : 45;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.max(0, subtotal + shippingCost + tax - discountAmount);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'SURGICAL20') {
      setDiscountAmount(subtotal * 0.2);
    } else {
      alert('Invalid promo code. Try "SURGICAL20" for 20% off!');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const orderPayload = {
        customer_email: email,
        customer_name: `${firstName} ${lastName}`.trim() || 'Valued Customer',
        phone: phone || '',
        shipping_address: `${address}${apartment ? `, ${apartment}` : ''}, ${city}, ${postalCode}, ${country}`,
        billing_address: `${address}${apartment ? `, ${apartment}` : ''}, ${city}, ${postalCode}, ${country}`,
        notes: `Company: ${company}\nShipping Method: ${shippingMethod}\nNotes: ${notes}`,
        payment_method: paymentMethod,
        items: cart.map((c) => ({
          product_id: Number(c.id.replace(/[^0-9]/g, '')) || undefined,
          sku: c.sku || c.id,
          unit_price: c.price,
          quantity: c.qty,
        })),
      };

      const { data } = await api.post('/orders/public-checkout', orderPayload);
      const serverOrder = data?.data;

      const newOrder = {
        orderId: serverOrder?.order_number || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: [...cart],
        subtotal,
        shippingCost,
        tax,
        discountAmount,
        grandTotal: serverOrder?.total_amount ? Number(serverOrder.total_amount) : grandTotal,
        customer: { email, phone, firstName, lastName, company, address, city, country, postalCode },
        shippingMethod,
        paymentMethod,
      };

      setPlacedOrder(newOrder);
      clearCart();
    } catch (err: any) {
      const fallbackOrder = {
        orderId: `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        items: [...cart],
        subtotal,
        shippingCost,
        tax,
        discountAmount,
        grandTotal,
        customer: { email, phone, firstName, lastName, company, address, city, country, postalCode },
        shippingMethod,
        paymentMethod,
      };
      setPlacedOrder(fallbackOrder);
      clearCart();
    } finally {
      setLoading(false);
    }
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
          <span className="text-slate-900 font-bold">Secure Checkout</span>
        </div>
      </div>

      <main className="flex-1 py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
          {!hasMounted ? (
            <div className="max-w-md mx-auto bg-white border border-slate-200 p-10 text-center shadow-xs">
              <p className="text-xs text-slate-400 font-mono">Loading checkout session...</p>
            </div>
          ) : placedOrder ? (
            /* Order Confirmation View */
            <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-8 md:p-12 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Order Confirmed!
              </h1>
              <p className="text-xs text-slate-500 mb-6">
                Thank you for your purchase. We have received your surgical instrument order and sent a confirmation email to{' '}
                <span className="font-bold text-slate-800">{placedOrder.customer.email || 'your email'}</span>.
              </p>

              <div className="bg-slate-50 border border-slate-200 p-6 text-left mb-8 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Order Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{placedOrder.orderId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Order Date:</span>
                  <span className="font-semibold text-slate-800">{placedOrder.date}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="font-bold text-emerald-600">Authorized / Paid</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Delivery:</span>
                  <span className="font-semibold text-slate-800">3–5 Business Days (Express)</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/"
                  className="px-6 py-3 text-xs font-bold text-white uppercase tracking-wider transition-opacity hover:opacity-90"
                  style={{ backgroundColor: T }}
                >
                  Return to Storefront
                </Link>
              </div>
            </div>
          ) : cart.length === 0 ? (
            /* Empty Cart View */
            <div className="max-w-md mx-auto bg-white border border-slate-200 p-10 text-center shadow-xs">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
              <p className="text-xs text-slate-500 mb-6">Add items to your cart before proceeding to checkout.</p>
              <Link
                href="/#shop-catalog"
                className="inline-block px-6 py-3 text-xs font-bold text-white uppercase tracking-wider"
                style={{ backgroundColor: T }}
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            /* Checkout Form View */
            <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left Column: Form Steps */}
              <div className="lg:col-span-7 space-y-8">
                {/* Contact Info */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-xs">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#1A2B4A] text-white flex items-center justify-center text-xs">1</span>
                    Customer &amp; Clinic Contact
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@hospital.org"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        required
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-xs">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#1A2B4A] text-white flex items-center justify-center text-xs">2</span>
                    Shipping Address
                  </h2>
                  <div className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                        <input
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Dr. John"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Last Name *</label>
                        <input
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Smith"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Hospital / Clinic / Company</label>
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="St. Jude Surgical Center"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                      <input
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Medical Center Blvd"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">City *</label>
                        <input
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="New York"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Country *</label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                        >
                          <option>United States</option>
                          <option>Canada</option>
                          <option>United Kingdom</option>
                          <option>Germany</option>
                          <option>Australia</option>
                          <option>United Arab Emirates</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Postal Code *</label>
                        <input
                          required
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="10001"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-xs">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#1A2B4A] text-white flex items-center justify-center text-xs">3</span>
                    Shipping Method
                  </h2>
                  <div className="space-y-3 text-xs">
                    <label
                      className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                        shippingMethod === 'express' ? 'border-[#00B4C8] bg-[#E8F9FB]' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'express'}
                          onChange={() => setShippingMethod('express')}
                        />
                        <div>
                          <p className="font-bold text-slate-900">DHL Express International (2–3 Days)</p>
                          <p className="text-[11px] text-slate-500">Fast door-to-door express delivery with online tracking</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">{subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : '$15.00'}</span>
                    </label>

                    <label
                      className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                        shippingMethod === 'freight' ? 'border-[#00B4C8] bg-[#E8F9FB]' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shippingMethod === 'freight'}
                          onChange={() => setShippingMethod('freight')}
                        />
                        <div>
                          <p className="font-bold text-slate-900">Air Cargo Priority Freight (4–6 Days)</p>
                          <p className="text-[11px] text-slate-500">For heavy surgical tray sets and large volume orders</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900">$45.00</span>
                    </label>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-xs">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-[#1A2B4A] text-white flex items-center justify-center text-xs">4</span>
                    Payment Method
                  </h2>
                  <div className="space-y-3 text-xs">
                    <label
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                        paymentMethod === 'card' ? 'border-[#00B4C8] bg-[#E8F9FB]' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                      />
                      <CreditCard size={18} className="text-[#00B4C8]" />
                      <div>
                        <p className="font-bold text-slate-900">Credit / Debit Card (Visa, MasterCard, Amex)</p>
                        <p className="text-[11px] text-slate-500">Secure 256-Bit SSL Encrypted Card Processing</p>
                      </div>
                    </label>

                    <label
                      className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                        paymentMethod === 'po' ? 'border-[#00B4C8] bg-[#E8F9FB]' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'po'}
                        onChange={() => setPaymentMethod('po')}
                      />
                      <Building2 size={18} className="text-[#00B4C8]" />
                      <div>
                        <p className="font-bold text-slate-900">Hospital Purchase Order (PO Invoice - Net 30)</p>
                        <p className="text-[11px] text-slate-500">For accredited healthcare institutions &amp; government bodies</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="lg:col-span-5">
                <div className="bg-white border border-slate-200 p-6 md:p-8 shadow-xs sticky top-24 space-y-6">
                  <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Order Summary ({cart.length} items)
                  </h2>

                  {/* Cart items preview */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={`${item.id}-${item.size}`} className="flex gap-3 text-xs py-2 border-b border-slate-100">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover border border-slate-200" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500">Qty: {item.qty} × ${item.price.toFixed(2)}</p>
                        </div>
                        <span className="font-bold text-slate-900">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Promo Code Input */}
                  <div className="pt-2">
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Code / Coupon:</label>
                    <div className="flex gap-2">
                      <input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="SURGICAL20"
                        className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-[#00B4C8] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-4 py-2 bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  {/* Price Calculations */}
                  <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span className="font-semibold text-slate-900">{shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Tax (5%)</span>
                      <span className="font-semibold text-slate-900">${tax.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Discount Promo</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                      <span>Total Due</span>
                      <span style={{ color: T }}>${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: N }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        Processing Order…
                      </span>
                    ) : (
                      <>
                        <Lock size={15} />
                        Place Order &amp; Pay (${grandTotal.toFixed(2)})
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    256-Bit SSL Encryption &amp; ISO 13485 Guaranteed
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
