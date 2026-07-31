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

// ─── Color & Material Types ──────────────────────────────────────────────────

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface SupplierInfo {
  id: number;
  name: string;
  country_code?: string | null;
  country_flag?: string | null;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'archived';

export interface Product {
  id: number;
  category_id: number;
  supplier_id?: number | null;
  supplier_ref?: string | null;
  our_ref?: string | null;
  ba_ref?: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand?: string | null;
  season?: string | null;
  department?: string | null;
  colors?: ColorSwatch[] | null;
  materials?: string[] | null;
  proposed_retail?: number | null;
  proposed_qty?: number | null;
  image_url?: string | null;
  photos?: string[] | null;
  status: ProductStatus;
  supplier?: SupplierInfo | null;
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
  supplier_id?: number | null;
  supplier_ref?: string;
  our_ref?: string;
  brand?: string;
  season?: string;
  department?: string;
  name: string;
  description?: string;
  colors?: ColorSwatch[];
  materials?: string[];
  proposed_retail?: number;
  proposed_qty?: number;
  image_url?: string;
  photos?: string[];
  status?: ProductStatus;
  variants?: CreateVariantDto[];
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
