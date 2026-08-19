import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'StoreCo Surgical & Dental — Precision Medical Instruments',
  description:
    'Manufacturer & Exporter of ISO 13485 & CE Certified Surgical, Dental, Orthopedic, and Custom OEM Instrument Sets in Sialkot, Pakistan.',
  keywords: [
    'surgical instruments',
    'dental instruments',
    'medical equipment manufacturer',
    'ISO 13485 certified',
    'CE certified medical',
    'Sialkot instruments export',
    'custom OEM surgical sets',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'StoreCo Surgical & Dental',
    title: 'StoreCo Surgical & Dental — Precision Medical Instruments',
    description:
      'ISO 13485 & CE Certified Surgical & Dental Instruments Manufacturer & Global Exporter.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased text-slate-900 bg-white selection:bg-[#00B4C8] selection:text-white" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
