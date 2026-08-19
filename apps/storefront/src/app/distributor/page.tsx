'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ChevronRight, CheckCircle2, Globe2, ShieldCheck, Truck, Percent, Building2, Send, Check } from 'lucide-react';
import { toast } from 'sonner';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function DistributorPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    businessType: 'Medical Dealer',
    country: '',
    email: '',
    phone: '',
    orderVolume: '$10,000 - $50,000 / year',
    specialties: 'General Surgery, Orthopedic',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Distributor Application Submitted! Our Global Accounts Manager will contact you within 24 hours.');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#00B4C8] selection:text-white" suppressHydrationWarning>
      <Navbar />

      {/* Top Banner Section */}
      <section className="bg-[#1A2B4A] text-white py-14 px-4 sm:px-6 md:px-10 lg:px-16 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
            <Link href="/" className="hover:text-[#00B4C8] transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-500" />
            <span className="text-[#00B4C8] font-semibold">Become A Distributor</span>
          </div>

          <div className="max-w-3xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#00B4C8] mb-2 block">
              Global B2B Partnership Program
            </span>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Become An Authorized StoreCo Distributor
            </h1>
            <p className="text-sm text-slate-300 font-normal leading-relaxed">
              Expand your medical supply portfolio with ISO 13485 &amp; CE certified German steel surgical tools. Gain exclusive territory rights, factory-direct wholesale pricing, and OEM support.
            </p>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-14 space-y-16">
        {/* Partnership Benefits Grid */}
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 text-center mb-8" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Why Partner With StoreCo Surgical?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-50 border border-slate-200 space-y-2">
              <Percent className="text-[#00B4C8] mb-2" size={28} />
              <h3 className="font-bold text-sm text-slate-900">Factory Wholesale Discounts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Direct manufacturing margins with tiered volume discounts (up to 55% off list prices).
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 space-y-2">
              <ShieldCheck className="text-[#00B4C8] mb-2" size={28} />
              <h3 className="font-bold text-sm text-slate-900">ISO &amp; CE Certified</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complete audit documentation, certificates of conformance, and biocompatibility lab reports.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 space-y-2">
              <Building2 className="text-[#00B4C8] mb-2" size={28} />
              <h3 className="font-bold text-sm text-slate-900">Private Label &amp; Laser Etching</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Custom brand logo laser marking, barcode SKUs, and custom medical packaging for your market.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 space-y-2">
              <Truck className="text-[#00B4C8] mb-2" size={28} />
              <h3 className="font-bold text-sm text-slate-900">Priority Express Freight</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                DHL &amp; FedEx priority air freight with full customs clearance and temperature-controlled logistics.
              </p>
            </div>
          </div>
        </div>

        {/* Application Form & Contact Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Requirements & Info */}
          <div className="lg:col-span-5 space-y-6 bg-[#1A2B4A] text-white p-8">
            <h3 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Distributor Program Overview
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              StoreCo Surgical partners with established medical distributors, hospital procurement agencies, and dental trade dealers worldwide.
            </p>

            <div className="space-y-4 pt-2 text-xs">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Territory Protection</div>
                  <div className="text-slate-300 text-2xs">Exclusive regional distribution rights available for qualified partners.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Sample Kits &amp; Catalog Trays</div>
                  <div className="text-slate-300 text-2xs">Evaluation sample sets provided for hospital tender trials.</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-white">Warranty &amp; Replacement</div>
                  <div className="text-slate-300 text-2xs">Lifetime replacement warranty against manufacturing defects.</div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700 space-y-2 text-xs">
              <div className="font-bold text-white">Global Distribution Desk</div>
              <div className="text-slate-300">Email: b2b@storecosurgical.com</div>
              <div className="text-slate-300">WhatsApp / Direct: +92 (52) 429-8800</div>
            </div>
          </div>

          {/* Right Column: Application Form */}
          <div className="lg:col-span-7 bg-slate-50 p-8 border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Authorized Dealer Application Form
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Complete the form below and our international accounts director will evaluate your inquiry.
            </p>

            {submitted ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="text-base font-bold">Application Successfully Received!</h4>
                <p className="text-xs text-emerald-800">
                  Thank you for your interest in StoreCo Surgical. Our B2B partnership manager will review your business credentials and send our wholesale dealer price list to <strong>{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-[#1A2B4A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#00B4C8] transition-colors mt-2"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Dr. Alexander Vance"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Organization *</label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. MedTech Supplies Corp"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Business Type</label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    >
                      <option value="Medical Dealer">Medical Instrument Dealer</option>
                      <option value="Hospital Supplier">Hospital Supply Vendor</option>
                      <option value="Importer/Wholesaler">Importer / Wholesaler</option>
                      <option value="Clinic Chain">Dental / Surgery Clinic Chain</option>
                      <option value="OEM Partner">OEM Private Label Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Country / Region *</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="e.g. United Kingdom, Germany, USA"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Business Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="alex@medtech.com"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 20 7946 0912"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Annual Order Volume</label>
                  <select
                    value={formData.orderVolume}
                    onChange={(e) => setFormData({ ...formData, orderVolume: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                  >
                    <option value="Under $10,000">Under $10,000 / year</option>
                    <option value="$10,000 - $50,000">$10,000 - $50,000 / year</option>
                    <option value="$50,000 - $200,000">$50,000 - $200,000 / year</option>
                    <option value="$200,000+">$200,000+ / year (Tier 1 Premier)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialties &amp; Message</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your current distribution network or specific instrument lines required..."
                    className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A2B4A] hover:bg-[#00B4C8] text-white text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send size={14} />
                  Submit Dealer Application
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
