'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { ArrowRight, Sparkles } from 'lucide-react';

const T = '#00B4C8';
const N = '#1A2B4A';

const fallbackProducts = [
  {
    id: 1,
    img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=280&fit=crop&auto=format',
    name: 'Mayo Dissecting Scissors',
    spec: 'German Stainless Steel · CE Certified · 14cm',
    category: 'Surgical Scissors',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1579684453423-f84349ef60b0?w=400&h=280&fit=crop&auto=format',
    name: 'Kelly Hemostatic Forceps',
    spec: 'Serrated · ISO 13485 · 14cm',
    category: 'Forceps & Clamps',
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=280&fit=crop&auto=format',
    name: 'Dental Extraction Forceps Set',
    spec: 'Premium Grade Steel · Autoclavable',
    category: 'Dental Instruments',
  },
  {
    id: 4,
    img: 'https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&h=280&fit=crop&auto=format',
    name: 'Periodontal Scaler Set',
    spec: '6-Piece · CE Mark · German SS',
    category: 'Dental Instruments',
  },
];

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>(fallbackProducts);

  useEffect(() => {
    async function loadProducts() {
      try {
        const { data } = await api.get('/catalog/products?limit=8');
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((p: any) => ({
            id: p.id,
            img: p.image_url || fallbackProducts[0]?.img,
            name: p.title || p.name,
            spec: p.sku ? `SKU: ${p.sku} · CE Certified` : 'German Stainless Steel · CE Certified',
            category: p.category_name || 'Medical Instruments',
          }));
          setProducts(mapped);
        }
      } catch {
        // Fallback to static catalog if backend loading
      }
    }
    loadProducts();
  }, []);

  return (
    <section className="py-24 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: T }}>
            Bestsellers
          </p>
          <h2
            className="text-3xl lg:text-4xl font-bold"
            style={{ color: N, fontFamily: "'Montserrat', sans-serif" }}
          >
            Featured Instruments
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p.id}
              className="group rounded-2xl overflow-hidden border border-slate-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: T }}>
                  {p.category}
                </p>
                <h3
                  className="font-bold text-sm leading-snug mb-1.5 text-slate-900 line-clamp-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {p.name}
                </h3>
                <p className="text-2xs text-slate-400 mb-4 line-clamp-1">{p.spec}</p>
                <a
                  href="#inquiry"
                  className="flex items-center justify-center w-full py-2.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-md"
                  style={{ backgroundColor: T }}
                >
                  Request Quote
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
