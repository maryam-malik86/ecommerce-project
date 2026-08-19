'use client';

import { Shield } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';
const LBG = '#F4F7FA';

const certs = [
  { label: 'ISO 9001:2015', sub: 'Quality Management' },
  { label: 'ISO 13485', sub: 'Medical Devices' },
  { label: 'CE Mark', sub: 'European Conformity' },
  { label: 'FDA Registered', sub: 'US Compliance' },
  { label: 'SCCI Member', sub: 'Sialkot Chamber' },
];

export default function Certifications() {
  return (
    <section id="certifications" className="py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: T }}>
            Quality Assurance
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: N, fontFamily: "'Montserrat', sans-serif" }}
          >
            Our Quality Standards
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Every instrument leaving our facility undergoes rigorous quality control. Our international certifications reflect our commitment to manufacturing excellence and global regulatory compliance.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {certs.map(({ label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center w-48 h-36 rounded-2xl transition-all hover:shadow-md cursor-default border border-slate-200"
              style={{ backgroundColor: LBG }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: `${T}18` }}
              >
                <Shield size={19} style={{ color: T }} />
              </div>
              <p
                className="font-bold text-sm text-slate-900"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {label}
              </p>
              <p className="text-2xs text-slate-500 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
