import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import AuthModal from '../../components/AuthModal';
import CartDrawer from '../../components/CartDrawer';
import ProductCatalogView from '../../components/ProductCatalogView';

export const metadata: Metadata = {
  title: 'All Instruments | StoreCo Surgical',
  description: 'Explore our complete catalog of OR-grade surgical & dental instruments.',
};

async function getProducts() {
  try {
    const res = await fetch(
      `${process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api/v1'}/catalog/products?status=active&limit=50`,
      {
        headers: {
          'x-api-key': process.env['API_KEY'] ?? 'admin-api-key-dev-1234567890abcdef',
        },
        next: { revalidate: 30 },
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <AuthModal />
      <CartDrawer />
      <main className="flex-1">
        <ProductCatalogView initialProducts={products} />
      </main>
      <Footer />
    </div>
  );
}
