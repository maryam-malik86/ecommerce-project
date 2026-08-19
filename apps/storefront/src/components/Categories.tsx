'use client';

import { ChevronRight } from 'lucide-react';

export default function Categories() {
  return (
    <section id="categories-grid" className="py-16 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        {/* Section Header with "Shop by Category", Subtitle & Right VIEW ALL CATEGORIES Link */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2
              className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Shop by Category
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Find exactly what you're looking for.
            </p>
          </div>
          <a
            href="/products"
            className="text-xs font-extrabold uppercase tracking-wider text-slate-900 hover:text-[#00B4C8] transition-colors border-b-2 border-slate-900 hover:border-[#00B4C8] pb-0.5 self-start sm:self-auto"
          >
            VIEW ALL CATEGORIES
          </a>
        </div>

        {/* Asymmetric 3-Column Top Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Left Column (2 Stacked Cards) */}
          <div className="flex flex-col gap-6">
            {/* Orthopedic Instruments */}
            <a
              href="/products?category=Orthopedic"
              className="group relative border border-slate-200 shadow-xs overflow-hidden h-64 md:h-60 lg:h-64 flex flex-col justify-end bg-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&auto=format&fit=crop&q=80"
                alt="Orthopedic Instruments"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 bg-[#D1F1F5]/95 text-slate-900 p-5 transition-all duration-300 group-hover:bg-[#BCEBF1]/98 border-t border-[#00B4C8]/20 flex flex-col justify-end">
                <h3 className="font-bold text-lg lg:text-xl text-slate-900 transform group-hover:-translate-y-0.5 transition-transform duration-300">
                  Orthopedic Instruments
                </h3>
                <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 overflow-hidden">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed flex-1">
                      OR-grade bone holding forceps, compression plates &amp; precision osteotomes for trauma &amp; reconstructive surgery.
                    </p>
                    <ChevronRight size={18} className="text-[#00B4C8] transform translate-x-1 group-hover:translate-x-0 transition-transform duration-300 flex-shrink-0 mb-0.5" />
                  </div>
                </div>
              </div>
            </a>

            {/* Spine Surgery Instruments */}
            <a
              href="/products?category=Spine%20Surgery"
              className="group relative border border-slate-200 shadow-xs overflow-hidden h-64 md:h-60 lg:h-64 flex flex-col justify-end bg-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=800&auto=format&fit=crop&q=80"
                alt="Spine Surgery Instruments"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 bg-[#D1F1F5]/95 text-slate-900 p-5 transition-all duration-300 group-hover:bg-[#BCEBF1]/98 border-t border-[#00B4C8]/20 flex flex-col justify-end">
                <h3 className="font-bold text-lg lg:text-xl text-slate-900 transform group-hover:-translate-y-0.5 transition-transform duration-300">
                  Spine Surgery Instruments
                </h3>
                <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 overflow-hidden">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed flex-1">
                      Precision cervical, thoracic &amp; lumbar retractor systems with ultra-fine micro-dissectors &amp; curettes.
                    </p>
                    <ChevronRight size={18} className="text-[#00B4C8] transform translate-x-1 group-hover:translate-x-0 transition-transform duration-300 flex-shrink-0 mb-0.5" />
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Center Column (Tall Featured Portrait Card) */}
          <div className="flex">
            <a
              href="/products?category=General%20Surgery"
              className="group relative border border-slate-200 shadow-xs overflow-hidden w-full min-h-[460px] md:min-h-full flex flex-col justify-end bg-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=900&auto=format&fit=crop&q=80"
                alt="General Surgery Instruments"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 bg-[#D1F1F5]/95 text-slate-900 p-6 transition-all duration-300 group-hover:bg-[#BCEBF1]/98 border-t border-[#00B4C8]/20 flex flex-col justify-end">
                <h3 className="font-bold text-xl lg:text-2xl uppercase text-slate-900 tracking-wide transform group-hover:-translate-y-0.5 transition-transform duration-300">
                  GENERAL SURGERY INSTRUMENTS
                </h3>
                <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 overflow-hidden">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed flex-1">
                      Premium OR-grade gold-handled dissecting scissors, tissue forceps, needle holders &amp; hemostatic clamps.
                    </p>
                    <ChevronRight size={20} className="text-[#00B4C8] transform translate-x-1 group-hover:translate-x-0 transition-transform duration-300 flex-shrink-0 mb-0.5" />
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* Right Column (2 Stacked Cards) */}
          <div className="flex flex-col gap-6">
            {/* Cardiovascular Instruments */}
            <a
              href="/products?category=Cardiovascular"
              className="group relative border border-slate-200 shadow-xs overflow-hidden h-64 md:h-60 lg:h-64 flex flex-col justify-end bg-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80"
                alt="Cardiovascular Instruments"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 bg-[#D1F1F5]/95 text-slate-900 p-5 transition-all duration-300 group-hover:bg-[#BCEBF1]/98 border-t border-[#00B4C8]/20 flex flex-col justify-end">
                <h3 className="font-bold text-lg lg:text-xl text-slate-900 transform group-hover:-translate-y-0.5 transition-transform duration-300">
                  Cardiovascular Instruments
                </h3>
                <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 overflow-hidden">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed flex-1">
                      Atraumatic micro-vascular clamps, deBakey tissue forceps &amp; delicate vascular scissors for cardiac procedures.
                    </p>
                    <ChevronRight size={18} className="text-[#00B4C8] transform translate-x-1 group-hover:translate-x-0 transition-transform duration-300 flex-shrink-0 mb-0.5" />
                  </div>
                </div>
              </div>
            </a>

            {/* Gynecology Instruments */}
            <a
              href="/products?category=Gynecology"
              className="group relative border border-slate-200 shadow-xs overflow-hidden h-64 md:h-60 lg:h-64 flex flex-col justify-end bg-slate-100"
            >
              <img
                src="https://images.unsplash.com/photo-1530026405186-ed1f139313f3?w=800&auto=format&fit=crop&q=80"
                alt="Gynecology Instruments"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 bg-[#D1F1F5]/95 text-slate-900 p-5 transition-all duration-300 group-hover:bg-[#BCEBF1]/98 border-t border-[#00B4C8]/20 flex flex-col justify-end">
                <h3 className="font-bold text-lg lg:text-xl text-slate-900 transform group-hover:-translate-y-0.5 transition-transform duration-300">
                  Gynecology Instruments
                </h3>
                <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2 transition-all duration-300 overflow-hidden">
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs text-slate-700 font-normal leading-relaxed flex-1">
                      Vaginal speculums, uterine dilators, cervical biopsy punch forceps &amp; comprehensive ob-gyn tray sets.
                    </p>
                    <ChevronRight size={18} className="text-[#00B4C8] transform translate-x-1 group-hover:translate-x-0 transition-transform duration-300 flex-shrink-0 mb-0.5" />
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
