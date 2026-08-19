'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Phone, Mail, Search, ShoppingCart, ShoppingBag, Heart, User, ArrowRight, SlidersHorizontal, ChevronDown, Package, ShieldCheck, Truck, Award, Wrench, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '../lib/cartStore';
import { useHasMounted } from '../lib/useHasMounted';

import { fetchCategoryTree, ApiCategory } from '../lib/catalogApi';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';

const T = '#00B4C8';
const N = '#1A2B4A';

const FALLBACK_MAIN_CATEGORIES = [
  {
    name: 'Dental Instruments',
    children: [{ name: 'Extraction Forceps' }, { name: 'Scalers & Probes' }, { name: 'Dental Elevators' }],
  },
  {
    name: 'Surgical Scissors',
    children: [{ name: 'Dissecting Scissors' }, { name: 'Operating & Mayo Scissors' }, { name: 'Micro & Iris Scissors' }],
  },
  {
    name: 'Forceps & Clamps',
    children: [{ name: 'Tissue & Dressing Forceps' }, { name: 'Hemostatic Artery Clamps' }, { name: 'Towel Clamps & Retractors' }],
  },
  {
    name: 'Orthopedic Sets',
    children: [{ name: 'Periosteal Elevators' }, { name: 'Bone Curettes & Chisels' }, { name: 'Bone Holding Forceps' }],
  },
  {
    name: 'Implant Kits',
    children: [{ name: 'Surgical Implant Placement Systems' }, { name: 'Sinus Lift & Bone Grafting' }, { name: 'Torque Wrenches & Drivers' }],
  },
  {
    name: 'Liposuction Cannula',
    children: [{ name: 'Harvesting Cannula' }, { name: 'Tumescent Infiltration Cannula' }],
  },
  {
    name: 'Plastic Surgery',
    children: [{ name: 'Rhinoplasty Rasps & Calipers' }, { name: 'Facelift & Skin Retractors' }],
  },
  {
    name: 'Custom OEM Sets',
    children: [{ name: 'Private Label Kits' }, { name: 'Laser Etching & Trays' }],
  },
];

interface NavbarProps {
  onSelectCategory?: (cat: string) => void;
  onSearchSubmit?: (query: string, category?: string) => void;
}

export default function Navbar({ onSelectCategory, onSearchSubmit }: NavbarProps) {
  const hasMounted = useHasMounted();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [activeHoverCategoryIdx, setActiveHoverCategoryIdx] = useState<number>(0);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState<boolean>(false);
  const [usefulLinksDropdownOpen, setUsefulLinksDropdownOpen] = useState<boolean>(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('GBP (£)');
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState<boolean>(false);
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);

  const cart = useCartStore((s) => s.cart);
  const wishlist = useCartStore((s) => s.wishlist);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const setAuthOpen = useCartStore((s) => s.setAuthOpen);

  const cartCount = hasMounted ? cart.reduce((acc, item) => acc + item.qty, 0) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetchCategoryTree().then((tree) => {
      if (tree && tree.length > 0) {
        // Filter relevant medical categories
        const medicalOnly = tree.filter(
          (c) => !['Electronics & Gear', 'Home & Kitchen', 'Travel & Luggage'].includes(c.name)
        );
        if (medicalOnly.length > 0) setApiCategories(medicalOnly);
      }
    });
  }, []);

  const mainCategoriesList =
    apiCategories.length > 0
      ? apiCategories.map((c) => ({ name: c.name, children: c.children || [] }))
      : FALLBACK_MAIN_CATEGORIES;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) onSearchSubmit(search, searchCategory);
    if (onSelectCategory && searchCategory !== 'All') onSelectCategory(searchCategory);
    setMenuOpen(false);
    setCatDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm" suppressHydrationWarning>
      {/* Top Utility Moving Headline Banner Ticker */}
      <div className="hidden md:block overflow-hidden whitespace-nowrap h-9 bg-[#1A2B4A] border-b border-white/10 relative">
        <div className="animate-marquee flex items-center h-full gap-12 text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
          {[
            { icon: <Truck size={14} className="text-[#00B4C8]" />, text: 'FREE EXPRESS INTERNATIONAL SHIPPING ON ORDERS OVER $150' },
            { icon: <Award size={14} className="text-[#00B4C8]" />, text: 'ISO 13485 & CE CERTIFIED MEDICAL GRADE MANUFACTURER' },
            { icon: <CheckCircle2 size={14} className="text-[#00B4C8]" />, text: 'PREMIUM GERMAN STAINLESS STEEL SURGICAL & DENTAL TOOLS' },
            { icon: <Wrench size={14} className="text-[#00B4C8]" />, text: 'CUSTOM OEM & PRIVATE LABEL INSTRUMENT MANUFACTURING' },
            { icon: <Truck size={14} className="text-[#00B4C8]" />, text: 'FREE EXPRESS INTERNATIONAL SHIPPING ON ORDERS OVER $150' },
            { icon: <Award size={14} className="text-[#00B4C8]" />, text: 'ISO 13485 & CE CERTIFIED MEDICAL GRADE MANUFACTURER' },
            { icon: <CheckCircle2 size={14} className="text-[#00B4C8]" />, text: 'PREMIUM GERMAN STAINLESS STEEL SURGICAL & DENTAL TOOLS' },
            { icon: <Wrench size={14} className="text-[#00B4C8]" />, text: 'CUSTOM OEM & PRIVATE LABEL INSTRUMENT MANUFACTURING' },
          ].map((item, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {item.icon}
              <span>{item.text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 h-16 md:h-20 flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 text-slate-800" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Brand */}
        <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#00B4C8] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            S
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 block" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              StoreCo <span style={{ color: T }}>Surgical</span>
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-semibold">
              Medical Instruments
            </span>
          </div>
        </Link>

        {/* Search Bar with Seamless Integrated "All ▾" Dropdown */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative flex w-full items-center bg-white border border-slate-200 overflow-visible focus-within:border-[#00B4C8] transition-all">
            {/* "All ▾" Selector - Integrated seamlessly inside search container */}
            <div className="relative flex-shrink-0 h-full">
              <button
                type="button"
                onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:text-[#00B4C8] bg-slate-50 hover:bg-slate-100 border-r border-slate-200 transition-colors h-full"
              >
                <span className="truncate max-w-[120px]">{searchCategory === 'All' ? 'All' : searchCategory}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 text-slate-400 ${catDropdownOpen ? 'rotate-180 text-[#00B4C8]' : ''}`} />
              </button>

              {/* Styled Popover Dropdown with White background & Square borders */}
              {catDropdownOpen && (
                <>
                  {/* Backdrop click overlay to close */}
                  <div className="fixed inset-0 z-40" onClick={() => setCatDropdownOpen(false)} />

                  <div className="absolute top-full left-0 mt-1 z-50 w-72 bg-white text-slate-800 shadow-2xl border border-slate-200 overflow-hidden text-xs py-2 custom-scrollbar max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="relative z-10 font-medium">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchCategory('All');
                          setCatDropdownOpen(false);
                          if (onSelectCategory) onSelectCategory('All');
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 hover:text-[#00B4C8] transition-colors border-b border-slate-100 flex items-center justify-between ${
                          searchCategory === 'All' ? 'text-[#00B4C8] font-bold bg-[#E8F9FB]' : 'text-slate-800'
                        }`}
                      >
                        <span>All Categories</span>
                        {searchCategory === 'All' && <span className="text-xs font-bold text-[#00B4C8]">✓</span>}
                      </button>

                      {apiCategories.length > 0 ? (
                        apiCategories.map((cat) => (
                          <div key={cat.id} className="border-b border-slate-100 last:border-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSearchCategory(cat.name);
                                setCatDropdownOpen(false);
                                if (onSelectCategory) onSelectCategory(cat.name);
                              }}
                              className={`w-full text-left px-4 py-2.5 font-bold hover:bg-slate-50 hover:text-[#00B4C8] transition-colors flex items-center justify-between ${
                                searchCategory === cat.name ? 'text-[#00B4C8] bg-[#E8F9FB]' : 'text-slate-900'
                              }`}
                            >
                              <span>{cat.name}</span>
                              {searchCategory === cat.name && <span className="text-xs font-bold text-[#00B4C8]">✓</span>}
                            </button>
                            {cat.children && cat.children.length > 0 && (
                              <div className="pl-6 bg-slate-50/50 py-1">
                                {cat.children.map((sub) => (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => {
                                      setSearchCategory(sub.name);
                                      setCatDropdownOpen(false);
                                      if (onSelectCategory) onSelectCategory(sub.name);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-[11px] hover:text-[#00B4C8] transition-colors block ${
                                      searchCategory === sub.name ? 'text-[#00B4C8] font-bold' : 'text-slate-600'
                                    }`}
                                  >
                                    └ {sub.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        FALLBACK_MAIN_CATEGORIES.map((cat) => (
                          <button
                            key={cat.name}
                            type="button"
                            onClick={() => {
                              setSearchCategory(cat.name);
                              setCatDropdownOpen(false);
                              if (onSelectCategory) onSelectCategory(cat.name);
                            }}
                            className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 hover:text-[#00B4C8] transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between ${
                              searchCategory === cat.name ? 'text-[#00B4C8] font-bold bg-[#E8F9FB]' : 'text-slate-700'
                            }`}
                          >
                            <span>{cat.name}</span>
                            {searchCategory === cat.name && <span className="text-xs font-bold text-[#00B4C8]">✓</span>}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Keyword Input */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instruments, SKUs…"
              className="flex-1 px-4 py-2.5 text-xs bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-normal"
            />

            {/* Search Submit Button */}
            <button
              type="submit"
              className="px-4 py-2.5 text-slate-400 hover:text-[#00B4C8] transition-colors flex-shrink-0"
              aria-label="Search"
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* Right Actions: User Account + Wishlist Heart + Currency Selector + Shopping Bag + Teal Request Quote Button (Matching Screenshots 1, 2, 3, 4) */}
        <div className="flex items-center gap-3 sm:gap-4 ml-auto" suppressHydrationWarning>
          {/* 1. Request Quote Teal Button (Matching Screenshot 3) */}
          <Link
            href="/inquiry"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-xs"
            style={{ backgroundColor: T }}
          >
            <span>Request Quote</span>
            <ArrowRight size={13} />
          </Link>

          {/* 2. User Account Icon (Matching Screenshot 1) */}
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="p-1.5 text-slate-800 hover:text-[#00B4C8] transition-colors cursor-pointer"
            title="Account"
          >
            <User size={20} />
          </button>

          {/* 3. Wishlist Heart Icon with Red Badge Counter & Hover Dropdown (Matching Screenshots 1, 4) */}
          <div className="relative group/wishlist" suppressHydrationWarning>
            <Link
              href="/wishlist"
              className="p-1.5 relative text-slate-800 hover:text-rose-500 transition-colors block cursor-pointer"
              title="My Wishlist"
            >
              <Heart size={20} />
              {hasMounted && wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Wishlist Hover Dropdown Preview Menu */}
            <div className="absolute right-0 top-full mt-1 hidden group-hover/wishlist:block z-50 w-64 bg-white text-slate-800 shadow-2xl border border-slate-200 p-3 text-xs animate-in fade-in duration-150" suppressHydrationWarning>
              <div className="font-extrabold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>My Wishlist ({hasMounted ? wishlist.length : 0})</span>
                <Link href="/wishlist" className="text-2xs text-[#00B4C8] hover:underline font-bold">View Page</Link>
              </div>
              <div className="py-2" suppressHydrationWarning>
                {hasMounted && wishlist.length > 0 ? (
                  <p className="text-slate-600 font-medium text-2xs">You have {wishlist.length} item(s) saved in your wishlist.</p>
                ) : (
                  <p className="text-slate-400 italic text-2xs">Your wishlist is empty.</p>
                )}
              </div>
              <Link
                href="/wishlist"
                className="block w-full text-center py-2 bg-[#1A2B4A] hover:bg-[#00B4C8] text-white text-2xs font-extrabold uppercase tracking-wider transition-colors mt-1"
              >
                Go To Wishlist
              </Link>
            </div>
          </div>

          {/* 4. Currency Selector Icon & Dropdown Menu (Matching Screenshot 1 & 2) */}
          <div className="relative group/currency">
            <button
              type="button"
              onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
              className="p-1.5 text-slate-800 hover:text-[#00B4C8] transition-colors font-semibold text-sm flex items-center gap-0.5 cursor-pointer"
              title="Select Currency"
            >
              <span className="font-serif text-lg leading-none font-bold">£</span>
            </button>

            {/* Currency Dropdown Menu matching Screenshot 2 */}
            <div className="absolute right-0 top-full mt-1 hidden group-hover/currency:block z-50 w-32 bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 text-xs font-semibold animate-in fade-in duration-150">
              {['AUD ($)', 'EUR (€)', 'USD ($)', 'GBP (£)'].map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(curr);
                    setCurrencyDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors ${
                    selectedCurrency === curr ? 'font-extrabold text-slate-900 underline bg-slate-50' : 'text-slate-600'
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Shopping Bag Icon with Cart Badge Counter (Matching Screenshot 1) */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="p-1.5 relative text-slate-800 hover:text-[#00B4C8] transition-colors cursor-pointer"
            aria-label="Shopping Bag"
            title="Shopping Bag"
          >
            <ShoppingBag size={20} />
            {hasMounted && cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full text-white font-bold text-[10px] flex items-center justify-center shadow-xs" style={{ backgroundColor: T }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Bar matching reference layout */}
      <div className="hidden lg:block border-t border-slate-100 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 h-11 flex items-center justify-between text-xs font-semibold text-slate-700">
          {/* Left Navigation Group matching reference screenshot */}
          <div className="flex items-center gap-6">
            {/* Home Link */}
            <Link
              href="/"
              className="py-2 text-slate-900 font-bold hover:text-[#00B4C8] transition-colors"
            >
              Home
            </Link>

            {/* Shop Link */}
            <Link
              href="/products"
              className="py-2 text-slate-900 font-bold hover:text-[#00B4C8] transition-colors"
            >
              Shop
            </Link>

            {/* Categories ▾ Mega Menu Trigger */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <Link
                href="/products"
                className="flex items-center gap-1 hover:text-[#00B4C8] transition-colors font-medium text-slate-700 py-1"
              >
                <span>Categories</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 text-slate-400 group-hover:text-[#00B4C8] ${
                    productsDropdownOpen ? 'rotate-180 text-[#00B4C8]' : ''
                  }`}
                />
              </Link>

              {/* Mega Menu Popover Dropdown */}
              {productsDropdownOpen && (
                <div
                  className="absolute top-full left-0 z-50 w-[580px] bg-white text-slate-800 shadow-2xl border border-slate-200 p-4 grid grid-cols-12 gap-3 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Left Panel: Main Categories */}
                  <div className="col-span-5 border-r border-slate-100 pr-2 flex flex-col gap-0.5">
                    <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Major Categories
                    </div>
                    {mainCategoriesList.map((cat, idx) => {
                      const isSelected = activeHoverCategoryIdx === idx;
                      return (
                        <a
                          key={cat.name}
                          href={`/products?category=${encodeURIComponent(cat.name)}`}
                          onMouseEnter={() => setActiveHoverCategoryIdx(idx)}
                          onClick={() => setProductsDropdownOpen(false)}
                          className={`w-full text-left px-3 py-2 text-xs font-semibold transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-[#E8F9FB] text-[#00B4C8] font-bold'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-[#00B4C8]' : 'text-slate-400'}`}>›</span>
                        </a>
                      );
                    })}
                  </div>

                  {/* Right Panel: Subcategories for Active Main Category */}
                  <div className="col-span-7 pl-2 flex flex-col">
                    {mainCategoriesList[activeHoverCategoryIdx] && (
                      <>
                        <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#00B4C8] border-b border-slate-100 mb-2 flex items-center justify-between">
                          <span>{mainCategoriesList[activeHoverCategoryIdx].name}</span>
                          <a
                            href={`/products?category=${encodeURIComponent(mainCategoriesList[activeHoverCategoryIdx].name)}`}
                            onClick={() => setProductsDropdownOpen(false)}
                            className="text-[10px] font-semibold text-slate-400 hover:text-[#00B4C8] underline"
                          >
                            View All
                          </a>
                        </div>
                        <div className="flex flex-col gap-1 overflow-y-auto max-h-72 custom-scrollbar pr-1">
                          {mainCategoriesList[activeHoverCategoryIdx].children.map((sub: any) => {
                            const subName = typeof sub === 'string' ? sub : sub.name;
                            return (
                              <a
                                key={subName}
                                href={`/products?search=${encodeURIComponent(subName)}`}
                                onClick={() => setProductsDropdownOpen(false)}
                                className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-[#00B4C8] transition-colors flex items-center gap-2"
                              >
                                <span>{subName}</span>
                              </a>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Brochure */}
            <Link href="/inquiry" className="hover:text-[#00B4C8] transition-colors py-1 font-medium text-slate-700">
              Brochure
            </Link>

            {/* Surgical Instrument Sets */}
            <Link href="/products?category=General%20Surgery" className="hover:text-[#00B4C8] transition-colors py-1 font-medium text-slate-700">
              Surgical Instrument Sets
            </Link>

            {/* About Us */}
            <Link href="/about" className="hover:text-[#00B4C8] transition-colors py-1 font-medium text-slate-700">
              About Us
            </Link>

            {/* Useful Links ▾ */}
            <div
              className="relative group py-2"
              onMouseEnter={() => setUsefulLinksDropdownOpen(true)}
              onMouseLeave={() => setUsefulLinksDropdownOpen(false)}
            >
              <button type="button" className="flex items-center gap-1 hover:text-[#00B4C8] transition-colors font-medium text-slate-700 py-1">
                <span>Useful Links</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 text-slate-400 group-hover:text-[#00B4C8] ${
                    usefulLinksDropdownOpen ? 'rotate-180 text-[#00B4C8]' : ''
                  }`}
                />
              </button>

              {usefulLinksDropdownOpen && (
                <div className="absolute top-full left-0 z-50 w-56 bg-white text-slate-800 shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 duration-150 font-medium">
                  <Link href="/about" className="block px-4 py-2 hover:bg-[#E8F9FB] hover:text-[#00B4C8] transition-colors border-b border-slate-100">
                    ISO 13485 &amp; CE Quality Policy
                  </Link>
                  <Link href="/inquiry" className="block px-4 py-2 hover:bg-[#E8F9FB] hover:text-[#00B4C8] transition-colors border-b border-slate-100">
                    OEM Private Label Manufacturing
                  </Link>
                  <Link href="/distributor" className="block px-4 py-2 hover:bg-[#E8F9FB] hover:text-[#00B4C8] transition-colors border-b border-slate-100">
                    Global Export &amp; Logistics
                  </Link>
                  <Link href="/about" className="block px-4 py-2 hover:bg-[#E8F9FB] hover:text-[#00B4C8] transition-colors">
                    Lifetime Corrosion Guarantee
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Separator Divider */}
          <div className="h-4 w-px bg-slate-200 mx-2" />

          {/* Right Utility Group */}
          <div className="flex items-center gap-5 font-medium text-slate-600">
            <Link href="/inquiry" className="flex items-center gap-1.5 hover:text-[#00B4C8] transition-colors">
              <Package size={14} className="text-[#00B4C8]" />
              <span>Bulk Order</span>
            </Link>

            <Link href="/inquiry" className="flex items-center gap-1.5 hover:text-[#00B4C8] transition-colors">
              <ShieldCheck size={14} className="text-[#00B4C8]" />
              <span>Payment And Shipping Policy</span>
            </Link>

            <Link href="/distributor" className="flex items-center gap-1.5 hover:text-[#00B4C8] transition-colors text-slate-800 font-semibold">
              <User size={14} className="text-[#00B4C8]" />
              <span>Become A Distributor</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-5 py-5 shadow-xl">
          <form onSubmit={handleSearch} className="flex mb-4 border border-slate-200 rounded-lg overflow-hidden">
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-slate-100 px-2 py-2 text-[11px] font-semibold text-slate-700 outline-none border-r border-slate-200 cursor-pointer"
            >
              <option value="All">All</option>
              {mainCategoriesList.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalog…" className="flex-1 px-3 py-2 text-xs outline-none" />
            <button type="submit" className="px-3" style={{ backgroundColor: T }}><Search size={14} className="text-white" /></button>
          </form>
          <div className="flex flex-col gap-3">
            <button onClick={() => { onSelectCategory && onSelectCategory('All'); setMenuOpen(false); }} className="text-left text-xs font-bold text-slate-900 py-1">All Products</button>
            {mainCategoriesList.map((c) => (
              <div key={c.name} className="flex flex-col gap-1">
                <button onClick={() => { onSelectCategory && onSelectCategory(c.name); setMenuOpen(false); }} className="text-left text-xs font-bold text-slate-800 py-1 hover:text-[#00B4C8]">
                  {c.name}
                </button>
                {c.children && c.children.length > 0 && (
                  <div className="pl-3 flex flex-col gap-1 border-l-2 border-slate-100 ml-1">
                    {c.children.map((sub: any) => {
                      const subName = typeof sub === 'string' ? sub : sub.name;
                      return (
                        <button key={subName} onClick={() => { onSelectCategory && onSelectCategory(subName); setMenuOpen(false); }} className="text-left text-[11px] text-slate-500 py-0.5 hover:text-[#00B4C8]">
                          └ {subName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Global Modals for Cart Slide-out Drawer & User Authentication */}
      <CartDrawer />
      <AuthModal />
    </header>
  );
}
