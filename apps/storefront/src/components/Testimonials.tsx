'use client';

import { Star } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';
const LBG = '#F4F7FA';

const testimonials = [
  {
    text: 'StoreCo has been our most reliable surgical instrument supplier for three years. Quality is consistently excellent — every shipment meets our hospital procurement standards without exception.',
    name: 'Dr. James Hartwell',
    role: 'Procurement Manager',
    company: 'HealthFirst Distributors, USA',
    initials: 'JH',
    flag: '🇺🇸',
  },
  {
    text: "We import large volumes for Gulf region hospitals. StoreCo's pricing, certification documentation, and on-time delivery make them our preferred Sialkot manufacturer.",
    name: 'Ahmed Al-Rashidi',
    role: 'Medical Supplies Director',
    company: 'Gulf Healthcare Co., UAE',
    initials: 'AA',
    flag: '🇦🇪',
  },
  {
    text: 'The OEM branding service is outstanding. Custom packaging, laser engraving, and full CE documentation — exactly what European distributors demand. Highly recommended.',
    name: 'Maria Kowalski',
    role: 'Head of Purchasing',
    company: 'MedTech Europe GmbH, Germany',
    initials: 'MK',
    flag: '🇩🇪',
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="py-24" style={{ backgroundColor: LBG }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: T }}>
            Client Reviews
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold"
            style={{ color: N, fontFamily: "'Montserrat', sans-serif" }}
          >
            Trusted by Buyers Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={T} stroke="none" />
                ))}
              </div>
              <p className="text-slate-600 text-xs leading-relaxed italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                  style={{ backgroundColor: N, fontFamily: "'Montserrat', sans-serif" }}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">{t.name}</p>
                  <p className="text-2xs text-slate-400">{t.role} &middot; {t.company}</p>
                </div>
                <span className="ml-auto text-xl">{t.flag}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-6">
            Exporting to 50+ countries worldwide
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              ['🇺🇸', 'USA'],
              ['🇩🇪', 'Germany'],
              ['🇦🇪', 'UAE'],
              ['🇬🇧', 'United Kingdom'],
              ['🇫🇷', 'France'],
              ['🇸🇦', 'Saudi Arabia'],
              ['🇨🇦', 'Canada'],
              ['🇦🇺', 'Australia'],
            ].map(([flag, country]) => (
              <span key={country} className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                <span>{flag}</span> {country}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
