// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'archived';

export interface Product {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  created_at: Date;
  updated_at: Date;
}

// ─── Variant (SKU-level) ─────────────────────────────────────────────────────

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  option_label: string; // e.g. "Red / XL"
  cost_price: number;   // stored as DECIMAL(10,2)
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CreateProductDto {
  category_id: number;
  name: string;
  description?: string;
  status?: ProductStatus;
  variants: CreateVariantDto[];
}

export interface CreateVariantDto {
  sku: string;
  option_label: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  image_url?: string;
}

export interface UpdateProductDto extends Partial<Omit<CreateProductDto, 'variants'>> {}

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}
