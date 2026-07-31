import { CatalogRepository } from './catalog.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { ProductQueryInput } from './catalog.schemas.js';
import type { PaginatedResponse, ProductWithVariants } from '@ecommerce/shared-types';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CatalogService {
  private repo = new CatalogRepository();

  // ── Suppliers ─────────────────────────────────────────────────────────────

  async getAllSuppliers() {
    return this.repo.findAllSuppliers();
  }

  // ── Categories ──────────────────────────────────────────────────────────────

  async getAllCategories() {
    return this.repo.findAllCategories();
  }

  async createCategory(name: string, description?: string, parent_id?: number) {
    const slug = toSlug(name);
    const id = await this.repo.createCategory({ name, slug, description, parent_id });
    return this.repo.findCategoryById(id);
  }

  async updateCategory(id: number, name?: string, description?: string, parent_id?: number | null) {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw createApiError(404, `Category with id ${id} not found`);
    const data: Record<string, any> = {};
    if (name) { data['name'] = name; data['slug'] = toSlug(name); }
    if (description !== undefined) data['description'] = description;
    if (parent_id !== undefined) data['parent_id'] = parent_id;
    await this.repo.updateCategory(id, data);
    return this.repo.findCategoryById(id);
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw createApiError(404, `Category with id ${id} not found`);
    await this.repo.deleteCategory(id);
  }

  // ── Products / Items ────────────────────────────────────────────────────────

  async listProducts(query: ProductQueryInput): Promise<PaginatedResponse<ProductWithVariants>> {
    const { rows, total } = await this.repo.findProducts(query);
    const { page = 1, limit = 50 } = query;
    const total_pages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Products retrieved',
      data: rows as unknown as ProductWithVariants[],
      pagination: {
        page,
        limit,
        total,
        total_pages,
        has_next: page < total_pages,
        has_prev: page > 1,
      },
    };
  }

  async getProduct(id: number) {
    const product = await this.repo.findProductByIdWithVariants(id);
    if (!product) throw createApiError(404, `Product with id ${id} not found`);
    return product;
  }

  async createProduct(input: any) {
    const baseSlug = toSlug(input.name);
    const existing = await this.repo.findProductBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
    const ba_ref = input.ba_ref || `BA-${Math.floor(1000 + Math.random() * 9000)}`;

    const productId = await this.repo.createProduct({
      category_id: input.category_id || 1,
      supplier_id: input.supplier_id || null,
      supplier_ref: input.supplier_ref || null,
      our_ref: input.our_ref || null,
      ba_ref,
      brand: input.brand || null,
      season: input.season || null,
      department: input.department || null,
      name: input.name,
      slug,
      description: input.description ?? null,
      colors: input.colors || [],
      materials: input.materials || [],
      proposed_retail: input.proposed_retail || input.selling_price || 0,
      proposed_qty: input.proposed_qty || input.stock_quantity || 0,
      image_url: input.image_url || input.photos?.[0] || null,
      photos: input.photos || (input.image_url ? [input.image_url] : []),
      status: input.status || 'active',
    });

    // Create default variant if variants provided or fallback
    const variants = input.variants && input.variants.length > 0 ? input.variants : [
      {
        sku: input.supplier_ref ? `${input.supplier_ref}-STD` : `SKU-${Date.now()}`,
        option_label: 'Standard',
        cost_price: input.cost_price || 0,
        selling_price: input.proposed_retail || input.selling_price || 0,
        stock_quantity: input.proposed_qty || input.stock_quantity || 0,
        image_url: input.image_url || null,
      }
    ];

    for (const v of variants) {
      await this.repo.createVariant({
        product_id: productId,
        sku: v.sku || `SKU-${Date.now()}`,
        option_label: v.option_label || 'Standard',
        cost_price: v.cost_price || 0,
        selling_price: v.selling_price || input.proposed_retail || 0,
        stock_quantity: v.stock_quantity || input.proposed_qty || 0,
        low_stock_threshold: v.low_stock_threshold ?? 5,
        image_url: v.image_url || input.image_url || null,
      });
    }

    return this.repo.findProductByIdWithVariants(productId);
  }

  async updateProduct(id: number, input: any) {
    const existing = await this.repo.findProductByIdWithVariants(id);
    if (!existing) throw createApiError(404, `Product with id ${id} not found`);

    const updatePayload: Record<string, any> = {};
    if (input.name) { updatePayload['name'] = input.name; updatePayload['slug'] = toSlug(input.name); }
    if (input.category_id) updatePayload['category_id'] = input.category_id;
    if (input.supplier_id !== undefined) updatePayload['supplier_id'] = input.supplier_id;
    if (input.supplier_ref !== undefined) updatePayload['supplier_ref'] = input.supplier_ref;
    if (input.our_ref !== undefined) updatePayload['our_ref'] = input.our_ref;
    if (input.brand !== undefined) updatePayload['brand'] = input.brand;
    if (input.season !== undefined) updatePayload['season'] = input.season;
    if (input.department !== undefined) updatePayload['department'] = input.department;
    if (input.colors !== undefined) updatePayload['colors'] = input.colors;
    if (input.materials !== undefined) updatePayload['materials'] = input.materials;
    if (input.proposed_retail !== undefined) updatePayload['proposed_retail'] = input.proposed_retail;
    if (input.proposed_qty !== undefined) updatePayload['proposed_qty'] = input.proposed_qty;
    if (input.image_url !== undefined) updatePayload['image_url'] = input.image_url;
    if (input.photos !== undefined) updatePayload['photos'] = input.photos;
    if (input.description !== undefined) updatePayload['description'] = input.description;
    if (input.status) updatePayload['status'] = input.status;

    if (Object.keys(updatePayload).length > 0) {
      await this.repo.updateProduct(id, updatePayload);
    }

    return this.repo.findProductByIdWithVariants(id);
  }

  async deleteProduct(id: number): Promise<void> {
    const existing = await this.repo.findProductByIdWithVariants(id);
    if (!existing) throw createApiError(404, `Product with id ${id} not found`);
    await this.repo.deleteProduct(id);
  }
}
