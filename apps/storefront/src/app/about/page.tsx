'use client';

import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ChevronRight, Award, ShieldCheck, CheckCircle2, Truck, Wrench, Globe2, Building2, Users, FileCheck } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#00B4C8] selection:text-white" suppressHydrationWarning>
      <Navbar />

      {/* Hero Banner Section */}
      <section className="bg-[#1A2B4A] text-white py-16 px-4 sm:px-6 md:px-10 lg:px-16 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 40px)`,
          }}
        />
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
            <Link href="/" className="hover:text-[#00B4C8] transition-colors">
              Home
            </Link>
            <ChevronRight size={13} className="text-slate-500" />
            <span className="text-[#00B4C8] font-semibold">About Us</span>
          </div>

          <div className="max-w-3xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#00B4C8] mb-2 block">
              Manufacturing Heritage &amp; Precision Engineering
            </span>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Crafting World-Class Surgical &amp; Dental Instruments
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              StoreCo Surgical is an ISO 13485 &amp; CE certified manufacturer and global exporter of OR-grade surgical, dental, orthopedic, and cardiovascular instruments forged from premium German stainless steel.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-[#00B4C8] text-white py-10 px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono">35+</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-teal-100 mt-1">Years Experience</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono">50+</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-teal-100 mt-1">Countries Exported</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono">12,000+</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-teal-100 mt-1">Instruments Catalog</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black font-mono">100%</div>
            <div className="text-xs uppercase tracking-wider font-semibold text-teal-100 mt-1">German Steel Forged</div>
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-16 space-y-20">
        {/* Section 1: Our Story & Process */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00B4C8]">Our Mission</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Forged For Uncompromising Surgical Precision
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Founded in Sialkot, Pakistan — the global capital of surgical instrument manufacturing — StoreCo Surgical combines decades of traditional craftsmanship with modern CNC milling, laser cutting, and electro-polishing technology.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every instrument undergoes rigorous metallurgical inspection, Rockwell hardness testing (HRC 48-52), and passivization to prevent corrosion under extreme autoclave sterilization cycles.
            </p>
            <div className="pt-2 grid grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00B4C8]" />
                <span>German Steel 420 &amp; 440A</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00B4C8]" />
                <span>Tungsten Carbide Jaw Inserts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00B4C8]" />
                <span>Passivated Anti-Corrosion</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#00B4C8]" />
                <span>Autoclave Sterilizable 134°C</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-100 aspect-video">
              <img
                src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1000&auto=format&fit=crop&q=80"
                alt="StoreCo Surgical Instrument Manufacturing"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Quality & Certification Grid */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00B4C8]">Certified Quality</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              International Regulatory Certifications
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Our quality management system is audited annually to comply with international medical device directives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F9FB] text-[#00B4C8] flex items-center justify-center mx-auto">
                <Award size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">ISO 13485:2016 Certified</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Comprehensive quality management standard for medical devices, guaranteeing traceability from raw ingot to finished instrument.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F9FB] text-[#00B4C8] flex items-center justify-center mx-auto">
                <FileCheck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">CE Mark Compliance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Complies with European Medical Device Regulation (MDR) for hospital safety, bio-compatibility, and sterile packaging.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#E8F9FB] text-[#00B4C8] flex items-center justify-center mx-auto">
                <Wrench size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Custom OEM &amp; Private Label</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Precision fiber-laser etching, custom color ring coding, and custom tray layout configuration for OEM hospital suppliers.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Call to Action Banner */}
        <div className="bg-[#1A2B4A] text-white p-8 sm:p-12 text-center relative overflow-hidden">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Partner With StoreCo Surgical Today
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-8">
            Whether you require standard catalog instruments or custom OEM manufacturing, our technical engineering team is ready to assist.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/distributor"
              className="px-6 py-3.5 bg-[#00B4C8] hover:bg-teal-600 text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Become A Distributor
            </Link>
            <Link
              href="/inquiry"
              className="px-6 py-3.5 border border-slate-400 hover:border-white text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Request Custom Quote
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
