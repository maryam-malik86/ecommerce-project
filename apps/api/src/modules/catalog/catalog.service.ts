import { CatalogRepository } from './catalog.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from './catalog.schemas.js';
import type { PaginatedResponse, ProductWithVariants } from '@ecommerce/shared-types';

// Inline slug generator (avoids ESM/CJS slugify compat issues)
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

  // ── Products ────────────────────────────────────────────────────────────────

  async listProducts(query: ProductQueryInput): Promise<PaginatedResponse<ProductWithVariants>> {
    const { rows, total } = await this.repo.findProducts(query);
    const { page, limit } = query;
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

  async createProduct(input: CreateProductInput) {
    const baseSlug = toSlug(input.name);

    // Ensure slug uniqueness by appending timestamp if needed
    const existing = await this.repo.findProductBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const productId = await this.repo.createProduct({
      category_id: input.category_id,
      name: input.name,
      slug,
      description: input.description ?? null,
      status: input.status,
    });

    // Insert all variants
    for (const v of input.variants) {
      await this.repo.createVariant({
        product_id: productId,
        sku: v.sku,
        option_label: v.option_label,
        cost_price: v.cost_price,
        selling_price: v.selling_price,
        stock_quantity: v.stock_quantity,
        low_stock_threshold: v.low_stock_threshold ?? 5,
        image_url: v.image_url ?? null,
      });
    }

    return this.repo.findProductByIdWithVariants(productId);
  }

  async updateProduct(id: number, input: UpdateProductInput) {
    const existing = await this.repo.findProductByIdWithVariants(id);
    if (!existing) throw createApiError(404, `Product with id ${id} not found`);

    await this.repo.updateProduct(id, {
      ...(input.name && { name: input.name, slug: toSlug(input.name) }),
      ...(input.category_id && { category_id: input.category_id }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status && { status: input.status }),
    });

    if (input.variants && input.variants.length > 0) {
      for (const v of input.variants) {
        const firstVariant = existing.variants?.[0];
        if (v.id) {
          await this.repo.updateVariant(v.id, {
            sku: v.sku,
            option_label: v.option_label,
            cost_price: v.cost_price,
            selling_price: v.selling_price,
            stock_quantity: v.stock_quantity,
          });
        } else if (firstVariant) {
          await this.repo.updateVariant(firstVariant.id, {
            sku: v.sku,
            option_label: v.option_label,
            cost_price: v.cost_price,
            selling_price: v.selling_price,
            stock_quantity: v.stock_quantity,
          });
        } else {
          await this.repo.createVariant({
            product_id: id,
            sku: v.sku,
            option_label: v.option_label,
            cost_price: v.cost_price,
            selling_price: v.selling_price,
            stock_quantity: v.stock_quantity,
            low_stock_threshold: v.low_stock_threshold ?? 5,
            image_url: v.image_url ?? null,
          });
        }
      }
    }

    return this.repo.findProductByIdWithVariants(id);
  }

  async deleteProduct(id: number): Promise<void> {
    const existing = await this.repo.findProductByIdWithVariants(id);
    if (!existing) throw createApiError(404, `Product with id ${id} not found`);
    await this.repo.deleteProduct(id);
  }
}
