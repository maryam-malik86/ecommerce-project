'use client';

import { Phone, Send } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function MobileStickyCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex gap-3 shadow-2xl">
      <a
        href="tel:+92523551234"
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-colors hover:bg-slate-50"
        style={{ borderColor: N, color: N }}
      >
        <Phone size={14} />
        Call Now
      </a>
      <a
        href="#inquiry"
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-md"
        style={{ backgroundColor: T }}
      >
        <Send size={14} />
        Request Quote
      </a>
    </div>
  );
}
