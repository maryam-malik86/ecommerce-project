'use client';

import { Check, ArrowRight } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';

const whyPoints = [
  'Premium Grade German Stainless Steel',
  'ISO 13485 & CE Certified',
  'Custom Branding / OEM Available',
  'Fast Worldwide Shipping',
  'Competitive Wholesale Pricing',
  '20+ Years Manufacturing Experience',
  'Full Export Documentation & Compliance',
];

export default function WhyChooseUs() {
  return (
    <section id="why" className="relative bg-[#1A2B4A] text-white overflow-hidden" style={{ minHeight: 580 }}>
      {/* Right-Side Split Background Image */}
      <div className="absolute inset-y-0 right-0 w-full lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=1000&h=800&fit=crop&auto=format"
          alt="Precision surgical instruments in sterile trays"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A2B4A] via-[#1A2B4A]/70 to-transparent lg:via-[#1A2B4A]/40" />
      </div>

      {/* Max-Width Container matching Navbar & Categories grid padding */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-20 flex items-center min-h-[580px]">
        <div className="max-w-xl lg:max-w-lg">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: T }}>
            Why StoreCo
          </p>
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-8"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Why Healthcare Professionals Trust StoreCo
          </h2>
          <ul className="space-y-3.5 mb-10">
            {whyPoints.map((pt) => (
              <li key={pt} className="flex items-center gap-3.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${T}22` }}
                >
                  <Check size={11} strokeWidth={3} style={{ color: T }} />
                </div>
                <span className="text-slate-200 text-sm leading-relaxed font-medium">{pt}</span>
              </li>
            ))}
          </ul>
          <a
            href="#inquiry"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg font-semibold text-white text-sm transition-opacity hover:opacity-90 shadow-lg"
            style={{ backgroundColor: T }}
          >
            Get a Quote Today
            <ArrowRight size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}
