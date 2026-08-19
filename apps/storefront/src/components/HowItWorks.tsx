'use client';

import { ClipboardList, Mail, Zap, Truck } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';
const LBG = '#F4F7FA';

const steps = [
  {
    num: '01',
    title: 'Browse Our Catalog',
    desc: 'Explore our complete range of surgical and dental instruments across product categories.',
    icon: <ClipboardList size={22} />,
  },
  {
    num: '02',
    title: 'Submit Inquiry Form',
    desc: 'Fill out our simple form with product specifications, quantities, and delivery requirements.',
    icon: <Mail size={22} />,
  },
  {
    num: '03',
    title: 'Receive Custom Quote',
    desc: 'Our export team reviews your needs and delivers a competitive wholesale quote within 24 hours.',
    icon: <Zap size={22} />,
  },
  {
    num: '04',
    title: 'Confirm & Ship',
    desc: 'Approve the order and we dispatch with full certification documentation and export paperwork.',
    icon: <Truck size={22} />,
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24" style={{ backgroundColor: LBG }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: T }}>
            Simple Process
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold"
            style={{ color: N, fontFamily: "'Montserrat', sans-serif" }}
          >
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.num} className="relative flex flex-col items-center text-center">
              {/* Step Circle */}
              <div
                className="relative w-16 h-16 rounded-full flex items-center justify-center text-white font-extrabold text-xl mb-5 z-10 shadow-lg"
                style={{
                  backgroundColor: T,
                  fontFamily: "'Montserrat', sans-serif",
                  boxShadow: `0 0 0 8px ${T}18`,
                }}
              >
                {step.num}
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${T}14`, color: T }}
              >
                {step.icon}
              </div>
              <h3
                className="font-bold text-sm mb-2 text-slate-900"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
