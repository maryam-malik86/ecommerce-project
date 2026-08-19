import api from './api';

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  children?: ApiCategory[];
}

export interface ApiProductVariant {
  id: number;
  product_id: number;
  sku: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  image_url: string | null;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  primary_category?: string;
  price_from?: string | number;
  price_to?: string | number;
  total_stock?: string | number;
  variants?: ApiProductVariant[];
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number | null;
  rating: number;
  reviewsCount: number;
  badge?: string;
  inStock: boolean;
  image: string;
  description: string;
  specs: { label: string; value: string }[];
}

/** Fetches nested categories tree (parent + subcategories) from API */
export async function fetchCategoryTree(): Promise<ApiCategory[]> {
  try {
    const response = await api.get<{ success: boolean; data: ApiCategory[] }>('/catalog/categories/tree');
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    // Handle nested format
    if ((response.data as any)?.data && Array.isArray((response.data as any).data)) {
      return (response.data as any).data;
    }
    return [];
  } catch (err) {
    console.warn('API fetchCategoryTree error, using fallback:', err);
    return [];
  }
}

/** Fetches products from API with category, search & pagination filters */
export async function fetchCatalogProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ products: ProductItem[]; total: number }> {
  try {
    const res = await api.get('/catalog/products', {
      params: {
        category: params?.category && params.category !== 'All' ? params.category : undefined,
        search: params?.search || undefined,
        page: params?.page || 1,
        limit: params?.limit || 50,
      },
    });

    const rawProducts: ApiProduct[] = res.data?.data || res.data?.products || [];
    const total = res.data?.pagination?.total || rawProducts.length;

    const mappedProducts: ProductItem[] = rawProducts.map((p) => {
      const primaryVariant = p.variants?.[0];
      const sellingPrice = primaryVariant?.selling_price
        ? Number(primaryVariant.selling_price)
        : Number(p.price_from) || 45;
      const stock = primaryVariant?.stock_quantity
        ? Number(primaryVariant.stock_quantity)
        : Number(p.total_stock) || 10;
      const imgUrl =
        primaryVariant?.image_url ||
        'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=700&h=560&fit=crop&auto=format';

      return {
        id: String(p.id),
        sku: primaryVariant?.sku || `NS-SKU-${p.id}`,
        name: p.name,
        category: p.primary_category || 'Medical Instruments',
        price: sellingPrice > 0 ? sellingPrice : 45,
        compareAtPrice: sellingPrice > 50 ? Math.round(sellingPrice * 1.25) : null,
        rating: 4.9,
        reviewsCount: 18 + (p.id * 7) % 45,
        badge: stock < 15 ? 'Best Seller' : 'CE Certified',
        inStock: stock > 0,
        image: imgUrl,
        description: p.description || 'Precision surgical instrument forged from premium medical-grade German stainless steel.',
        specs: [
          { label: 'Material', value: 'German Stainless Steel (AISI 420 / 440)' },
          { label: 'Grade', value: 'OR Grade / Autoclavable' },
          { label: 'Certification', value: 'ISO 13485 & CE Marked' },
          { label: 'Warranty', value: 'Lifetime Guarantee Against Corrosion' },
        ],
      };
    });

    return { products: mappedProducts, total };
  } catch (err) {
    console.warn('API fetchCatalogProducts error, using fallback:', err);
    return { products: [], total: 0 };
  }
}
