'use client';

import { Shield, Check, Award, Globe, Settings } from 'lucide-react';

const trustItems = [
  { icon: <Shield size={16} />, label: 'ISO Certified' },
  { icon: <Check size={16} />, label: 'FDA Compliant' },
  { icon: <Award size={16} />, label: '20+ Years Experience' },
  { icon: <Globe size={16} />, label: 'Global Export' },
  { icon: <Settings size={16} />, label: 'Custom OEM Available' },
];

export default function TrustBar() {
  return (
    <section className="py-5" style={{ backgroundColor: '#009BB0' }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="flex flex-wrap justify-center lg:justify-between items-center gap-6">
          {trustItems.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 text-white">
              <div className="opacity-90">{icon}</div>
              <span className="text-xs font-bold tracking-widest uppercase">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
