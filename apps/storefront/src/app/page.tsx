'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Categories from '../components/Categories';
import ShopCatalog from '../components/ShopCatalog';
import Testimonials from '../components/Testimonials';
import WhyChooseUs from '../components/WhyChooseUs';
import Certifications from '../components/Certifications';
import InquirySection from '../components/InquirySection';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import AuthModal from '../components/AuthModal';
import MobileStickyCTA from '../components/MobileStickyCTA';

export default function StorefrontHomePage() {
  const [selectedCat, setSelectedCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelectCategory = (cat: string) => {
    setSelectedCat(cat);
    const shopEl = document.getElementById('shop-catalog');
    if (shopEl) shopEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSearchSubmit = (query: string, category?: string) => {
    if (category) {
      setSelectedCat(category);
    }
    setSearchQuery(query);
    const shopEl = document.getElementById('shop-catalog');
    if (shopEl) shopEl.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-white selection:bg-[#00B4C8] selection:text-white">
      {/* 1. Top Headline + Logo & Search Bar + Category Bar */}
      <Navbar
        onSelectCategory={handleSelectCategory}
        onSearchSubmit={handleSearchSubmit}
      />

      {/* 2. Banner Part (Hero) */}
      <Hero />

      {/* 3. Shop by Category */}
      <Categories />

      {/* 4. About Us & Company Overview */}
      <WhyChooseUs />

      {/* 5. Featured & Trending Products */}
      <ShopCatalog selectedCategory={selectedCat} searchQuery={searchQuery} />

      {/* 6. Customer Reviews / Testimonials */}
      <Testimonials />

      {/* 7. Quality Certifications */}
      <Certifications />

      {/* 8. Inquiry / Ask a Question (B2B Form) */}
      <InquirySection />

      {/* 7. Footer */}
      <Footer />

      {/* Slide-over Drawers & Modals */}
      <CartDrawer />
      <AuthModal />
      <MobileStickyCTA />
    </main>
  );
}
