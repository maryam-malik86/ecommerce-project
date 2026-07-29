import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | E-Commerce Store',
    default: 'E-Commerce Store — Quality Products at Great Prices',
  },
  description:
    'Shop the latest products across all categories. Fast shipping, secure checkout, and great prices guaranteed.',
  keywords: ['e-commerce', 'online shopping', 'products', 'deals'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'E-Commerce Store',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-gray-900">⚡ ShopFast</a>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <a href="/products" className="hover:text-gray-900 transition-colors">Products</a>
              <a href="/cart" className="hover:text-gray-900 transition-colors">🛒 Cart</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-gray-200 mt-20">
          <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} ShopFast. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
