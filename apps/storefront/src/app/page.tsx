import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home — E-Commerce Store',
  description: 'Discover our latest collection of products.',
};

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
          Shop the Latest Collection
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
          Discover amazing products at unbeatable prices. Fast shipping and secure checkout guaranteed.
        </p>
        <div className="mt-10 flex gap-4 justify-center">
          <a
            href="/products"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3
                       rounded-lg transition-colors duration-200"
          >
            Shop Now
          </a>
          <a
            href="/products"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold
                       px-8 py-3 rounded-lg transition-colors duration-200"
          >
            View All Products
          </a>
        </div>
      </section>

      {/* Featured Categories Placeholder */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {['Electronics', 'Clothing', 'Home & Garden', 'Sports'].map((cat) => (
            <a
              key={cat}
              href={`/products?category=${cat.toLowerCase()}`}
              className="aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl
                         flex items-center justify-center border border-gray-200 hover:border-indigo-300
                         transition-colors group"
            >
              <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                {cat}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
