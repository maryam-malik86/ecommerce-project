'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

const T = '#00B4C8';
const N = '#1A2B4A';
const TEAL_BG = '#E8F9FB';

const categories = [
  { id: 'general', label: '💬 General Client Query' },
  { id: 'sales', label: '💼 Wholesale & Bulk Sales' },
  { id: 'product_question', label: '🛍️ Product Specifications' },
  { id: 'shipping', label: '📦 International Shipping' },
  { id: 'partnership', label: '🤝 Custom OEM / Private Label' },
];

export default function InquirySection() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    category: 'sales',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        customer_name: formData.name,
        customer_email: formData.email,
        subject: formData.subject || `B2B Quote Request - ${formData.company || formData.name}`,
        category: formData.category,
        priority: 'high',
        message: `Company/Hospital: ${formData.company || 'N/A'}\nPhone: ${formData.phone || 'N/A'}\n\nDetails:\n${formData.message}`,
      };

      const { data } = await api.post('/order-inquiries', payload);
      const inquiryNum = data?.data?.inquiry_number || 'INQ-SUCCESS';

      setSubmittedRef(inquiryNum);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        category: 'sales',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="inquiry" className="py-24" style={{ backgroundColor: TEAL_BG }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-14 items-start">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: T }}>
              Contact Us
            </p>
            <h2
              className="text-3xl lg:text-4xl font-bold leading-tight mb-5"
              style={{ color: N, fontFamily: "'Montserrat', sans-serif" }}
            >
              Get a Custom Quote
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-10">
              We supply hospitals, distributors, and importers worldwide. Share your requirements and our export team will respond with a competitive wholesale quote within 24 hours.
            </p>
            <div className="space-y-6">
              {[
                { icon: <Phone size={16} />, label: 'Phone / WhatsApp', val: '+92-52-355-1234' },
                { icon: <Mail size={16} />, label: 'Email', val: 'export@storeco-surgical.com' },
                { icon: <MapPin size={16} />, label: 'Address', val: 'Sialkot, Punjab, Pakistan' },
                { icon: <MessageCircle size={16} />, label: 'WhatsApp Direct', val: '+92-300-123-4567' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${T}20`, color: T }}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-sm font-semibold" style={{ color: N }}>{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-3">
            {submittedRef ? (
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-[#D4EFF3] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Inquiry Submitted Successfully!
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Your RFQ reference is <span className="font-mono font-bold text-indigo-600">{submittedRef}</span>. An automated email confirmation has been dispatched to your inbox. Our export specialist will follow up within 24 hours.
                </p>
                <button
                  onClick={() => setSubmittedRef(null)}
                  className="px-6 py-2.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all hover:opacity-90 mt-4"
                  style={{ backgroundColor: N }}
                >
                  Submit Another Inquiry
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl p-8 shadow-sm border border-[#D4EFF3] space-y-5"
              >
                {errorMsg && (
                  <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Full Name *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Dr. John Smith"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Company / Hospital Name
                    </label>
                    <input
                      type="text"
                      placeholder="HealthFirst Ltd."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Email Address *
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Phone / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Inquiry Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Subject *
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Bulk quote request for 500 Surgical Scissors"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: N }}>
                      Message / Special Specifications *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Please describe your requirements, quantities, and any custom branding or packaging specifications…"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm bg-[#F8FAFB] focus:outline-none focus:border-[#00B4C8] transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full py-3.5 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.99] flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  style={{ backgroundColor: N }}
                >
                  <Send size={16} />
                  {loading ? 'Submitting Inquiry…' : 'Send Inquiry Request'}
                </button>
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  We respond within 24 hours. Your information is strictly confidential.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
