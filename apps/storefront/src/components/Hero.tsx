'use client';

const T = '#00B4C8';
const N = '#1A2B4A';

export default function Hero() {
  return (
    <section
      className="relative min-h-[50vh] flex items-center overflow-hidden py-16 lg:py-24"
      style={{ backgroundColor: N }}
    >
      {/* Background glow and subtle diagonal pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 64px)`,
        }}
      />
      <div
        className="absolute top-0 right-0 w-[650px] h-[650px] pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, rgba(0,180,200,0.16) 0%, transparent 65%)` }}
      />

      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 w-full text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Title & Subheading */}
          <div className="lg:col-span-7">
            <h1 className="mb-6" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <span
                className="block font-black text-6xl sm:text-7xl lg:text-8xl tracking-tight leading-[0.95] mb-1"
                style={{ color: T }}
              >
                Forged
              </span>
              <span className="block font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-tight">
                For Precision
              </span>
            </h1>

            {/* Subheading with highlighted accent */}
            <h2
              className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-5 leading-snug tracking-tight"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <span style={{ color: T }}>Complete Range of </span>
              <span className="text-white font-extrabold">Instruments</span>
              <span className="block mt-1" style={{ color: T }}>
                Under One Place.
              </span>
            </h2>

            {/* Description Line */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl leading-relaxed font-normal mb-8">
              StoreCo Surgical seeks to provide quality surgical &amp; dental instruments all over the world.
            </p>

            {/* Action Buttons (Matching Screenshot 2) */}
            <div className="flex items-center gap-4 flex-wrap">
              <a
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-none font-semibold text-sm text-white transition-all shadow-md hover:opacity-90"
                style={{ backgroundColor: '#0E8374' }}
              >
                <span>Shop instruments</span>
                <span>→</span>
              </a>
              <a
                href="#inquiry"
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-none font-semibold text-sm text-white border border-slate-600 hover:border-white transition-all"
              >
                Request a quote
              </a>
            </div>
          </div>

          {/* Right Column: Seamless Surgical Tools Image */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <img
              src="/images/hero-flatlay-tools.jpg"
              alt="Precision Surgical & Dental Instruments"
              className="w-full max-w-md lg:max-w-lg h-auto max-h-[440px] lg:max-h-[480px] rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
