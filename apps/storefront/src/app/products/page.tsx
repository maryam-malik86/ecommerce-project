import type { Metadata } from 'next';
import type { ProductWithVariants } from '@ecommerce/shared-types';

export const metadata: Metadata = {
  title: 'All Products',
  description: 'Browse our complete product catalog.',
};

// Server Component — data fetched at request time (SSR for SEO)
async function getProducts(): Promise<ProductWithVariants[]> {
  try {
    const res = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000'}/api/v1/catalog/products?status=active&limit=24`,
      {
        headers: {
          'x-api-key': process.env['API_KEY'] ?? '',
        },
        next: { revalidate: 60 }, // ISR: revalidate every 60 seconds
      },
    );

    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">All Products</h1>
      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No products available. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const lowestPrice = product.variants?.[0]?.selling_price ?? 0;
            return (
              <a
                key={product.id}
                href={`/products/${product.slug}`}
                className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300
                           hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {product.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>
                  <p className="mt-3 text-lg font-bold text-gray-900">
                    From ${Number(lowestPrice).toFixed(2)}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
