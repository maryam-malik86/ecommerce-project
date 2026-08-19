'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ChevronRight, FileText, Send, CheckCircle2, Award, Clock, ShieldCheck, Check } from 'lucide-react';
import { toast } from 'sonner';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function InquiryPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    category: 'Dental Instruments',
    quantity: '50 - 200 units',
    laserEtching: true,
    customTrays: false,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Quote Request Submitted! Our technical sales engineers will send a formal quote within 12 hours.');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#00B4C8] selection:text-white" suppressHydrationWarning>
      <Navbar />

      {/* Top Banner */}
      <section className="bg-[#1A2B4A] text-white py-14 px-4 sm:px-6 md:px-10 lg:px-16 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
            <Link href="/" className="hover:text-[#00B4C8] transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-500" />
            <span className="text-[#00B4C8] font-semibold">Request A Quote</span>
          </div>

          <div className="max-w-3xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#00B4C8] mb-2 block">
              Direct Factory Quotation &amp; OEM RFQ
            </span>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Request Custom Instrument Quotation
            </h1>
            <p className="text-sm text-slate-300 font-normal leading-relaxed">
              Submit your project specifications or target instrument list. Receive a comprehensive factory-direct quote within 12 business hours.
            </p>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-14 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Factory Guarantee & Technical Specs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-50 p-6 border border-slate-200 space-y-4">
              <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Quote Guarantee &amp; SLAs
              </h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800">12-Hour SLA Response</div>
                    <div>All institutional RFQs &amp; custom engineering inquiries receive rapid response.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Award size={18} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800">ISO 13485 Compliance</div>
                    <div>Material certificates (AISI 420/440A stainless steel) attached with every quotation.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800">OEM Branding Support</div>
                    <div>Free laser logo etching mockup on approved volume inquiries.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1A2B4A] text-white p-6 space-y-3 text-xs">
              <div className="font-bold text-[#00B4C8] uppercase tracking-wider text-2xs">Immediate Assistance</div>
              <div className="text-sm font-extrabold text-white">Need an Urgent Hospital Tender Quote?</div>
              <p className="text-slate-300 text-2xs">
                Call our technical sales team directly or send your PDF tender document via email.
              </p>
              <div className="pt-2 font-mono text-xs text-white">
                <div>Email: quotes@storecosurgical.com</div>
                <div>Phone: +92 (52) 429-8800</div>
              </div>
            </div>
          </div>

          {/* Right Column: Quote Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              RFQ &amp; Custom Quote Form
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Please specify target quantities, preferred sizes, and custom packaging requirements.
            </p>

            {submitted ? (
              <div className="p-8 text-center bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="text-base font-bold">Quote Request Submitted!</h4>
                <p className="text-xs text-emerald-800">
                  Thank you, <strong>{form.name}</strong>. Our medical instrument engineering team is compiling your customized quotation and will send it to <strong>{form.email}</strong> shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-[#1A2B4A] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#00B4C8] transition-colors mt-2"
                >
                  Submit Another Quote Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hospital / Business Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="sarah@hospital.org"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Organization / Clinic</label>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      placeholder="St. Jude General Hospital"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone / Mobile</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Primary Product Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    >
                      <option value="Dental Instruments">Dental Instruments</option>
                      <option value="Surgical Scissors">Surgical Scissors</option>
                      <option value="Forceps & Clamps">Forceps &amp; Clamps</option>
                      <option value="Orthopedic Sets">Orthopedic Sets</option>
                      <option value="Liposuction Cannula">Liposuction Cannula</option>
                      <option value="Plastic Surgery">Plastic Surgery Tools</option>
                      <option value="Custom OEM Set">Custom OEM Kit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Order Quantity</label>
                    <select
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                    >
                      <option value="10 - 50 units">10 - 50 units (Trial Order)</option>
                      <option value="50 - 200 units">50 - 200 units</option>
                      <option value="200 - 1000 units">200 - 1,000 units</option>
                      <option value="1000+ units">1,000+ units (Bulk Freight)</option>
                    </select>
                  </div>
                </div>

                {/* Checkbox Customizations */}
                <div className="pt-2 space-y-2">
                  <span className="block font-bold text-slate-700">Customization Requirements</span>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.laserEtching}
                        onChange={(e) => setForm({ ...form, laserEtching: e.target.checked })}
                        className="w-4 h-4 text-[#00B4C8] accent-[#00B4C8]"
                      />
                      <span>Laser Etched Brand Logo</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.customTrays}
                        onChange={(e) => setForm({ ...form, customTrays: e.target.checked })}
                        className="w-4 h-4 text-[#00B4C8] accent-[#00B4C8]"
                      />
                      <span>Sterilization Trays &amp; Cassettes</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Detailed Specifications &amp; SKUs</label>
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="List specific instrument names, SKU references, sizes, or custom modifications required..."
                    className="w-full px-3 py-2 border border-slate-300 bg-white focus:outline-none focus:border-[#00B4C8]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00B4C8] hover:bg-teal-600 text-white text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Send size={14} />
                  Submit Quotation Request
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
