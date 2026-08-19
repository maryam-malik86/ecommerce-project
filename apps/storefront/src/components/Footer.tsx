'use client';

import Link from 'next/link';
import { MapPin, Phone, MessageCircle, Mail, Shield } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: N, borderTop: `3px solid ${T}` }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-16 text-slate-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#00B4C8] text-white flex items-center justify-center font-extrabold text-lg">
                S
              </div>
              <span className="text-base font-extrabold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                StoreCo <span style={{ color: T }}>Surgical</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              Precision-crafted surgical and dental instruments, trusted by healthcare professionals across 50+ countries.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4
              className="font-bold text-white text-xs uppercase tracking-[0.15em] mb-5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Products Catalog</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us &amp; Certifications</Link></li>
              <li><Link href="/distributor" className="hover:text-white transition-colors">Become A Distributor</Link></li>
              <li><Link href="/inquiry" className="hover:text-white transition-colors">Request Quote / RFQ</Link></li>
              <li><Link href="/wishlist" className="hover:text-white transition-colors">My Wishlist</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4
              className="font-bold text-white text-xs uppercase tracking-[0.15em] mb-5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {['Dental Instruments', 'Surgical Scissors', 'Forceps & Clamps', 'Orthopedic Sets', 'Implant Kits', 'Custom OEM Sets'].map((name) => (
                <li key={name}>
                  <a href="#products" className="hover:text-white transition-colors">{name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4
              className="font-bold text-white text-xs uppercase tracking-[0.15em] mb-5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Contact Info
            </h4>
            <div className="space-y-3.5 text-xs text-slate-400">
              {[
                { icon: <MapPin size={13} />, text: 'Sialkot, Punjab, Pakistan' },
                { icon: <Phone size={13} />, text: '+92-52-355-1234' },
                { icon: <MessageCircle size={13} />, text: '+92-300-123-4567' },
                { icon: <Mail size={13} />, text: 'export@storeco-surgical.com' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0" style={{ color: T }}>{icon}</div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> StoreCo Surgical &amp; Dental. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <Shield size={12} style={{ color: T }} />
            ISO 13485 Certified Manufacturer &mdash; Sialkot, Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
