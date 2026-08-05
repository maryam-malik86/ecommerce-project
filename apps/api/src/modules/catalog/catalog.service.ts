import { CatalogRepository } from './catalog.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type {
  ProductQueryInput, AddOptionsInput,
  CreateProductInput, UpdateProductInput,
  PatchVariantInput, CreateCategoryInput, CreateCollectionInput,
} from './catalog.schemas.js';
import type { PaginatedResponse } from '@ecommerce/shared-types';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Derives a short prefix from the product name for auto-generated SKUs. */
function skuPrefix(name: string, ba_ref?: string | null): string {
  if (ba_ref) return ba_ref.toUpperCase().slice(0, 12);
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.slice(0, 3))
    .slice(0, 3)
    .join('-');
}

export class CatalogService {
  private repo = new CatalogRepository();

  // ── Suppliers ─────────────────────────────────────────────────────────────

  async getAllSuppliers() {
    return this.repo.findAllSuppliers();
  }

  async createSupplier(input: { name: string; country_code?: string; country_flag?: string; contact_email?: string; contact_phone?: string }) {
    if (!input.name || !input.name.trim()) throw createApiError(400, 'Supplier name is required');
    return this.repo.createSupplier(input);
  }

  // ── Categories ────────────────────────────────────────────────────────────

  async getCategoryTree() {
    return this.repo.findCategoryTree();
  }

  async getAllCategoriesFlat() {
    return this.repo.findAllCategoriesFlat();
  }

  async createCategory(input: CreateCategoryInput) {
    const slug = toSlug(input.name);
    const id = await this.repo.createCategory({ ...input, slug });
    return this.repo.findCategoryById(id);
  }

  async updateCategory(id: number, input: Partial<CreateCategoryInput>) {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw createApiError(404, `Category ${id} not found`);

    // Guard: cannot set a category as its own parent
    if (input.parent_id === id) throw createApiError(400, 'A category cannot be its own parent');

    const data: Record<string, any> = { ...input };
    if (input.name) data['slug'] = toSlug(input.name);
    await this.repo.updateCategory(id, data);
    return this.repo.findCategoryById(id);
  }

  async deleteCategory(id: number): Promise<void> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw createApiError(404, `Category ${id} not found`);
    await this.repo.deleteCategory(id);
  }

  // ── Collections ───────────────────────────────────────────────────────────

  async getAllCollections() {
    return this.repo.findAllCollections();
  }

  async createCollection(input: CreateCollectionInput) {
    const slug = toSlug(input.name);
    const id = await this.repo.createCollection({ ...input, slug });
    return this.repo.findCollectionById(id);
  }

  async updateCollection(id: number, input: Partial<CreateCollectionInput>) {
    const existing = await this.repo.findCollectionById(id);
    if (!existing) throw createApiError(404, `Collection ${id} not found`);
    const data: Record<string, any> = { ...input };
    if (input.name) data['slug'] = toSlug(input.name);
    await this.repo.updateCollection(id, data);
    return this.repo.findCollectionById(id);
  }

  async deleteCollection(id: number): Promise<void> {
    const existing = await this.repo.findCollectionById(id);
    if (!existing) throw createApiError(404, `Collection ${id} not found`);
    await this.repo.deleteCollection(id);
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async listProducts(query: ProductQueryInput): Promise<PaginatedResponse<any>> {
    const { rows, total } = await this.repo.findProducts(query);
    const { page = 1, limit = 50 } = query;
    const total_pages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Products retrieved',
      data: rows,
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
    if (!product) throw createApiError(404, `Product ${id} not found`);
    return product;
  }

  /**
   * POST /products
   *
   * Creates the product, attaches categories + collections, and creates
   * a single seed variant (no options yet — those come via addOptions +
   * generateVariants). Seed variant has draft prices from input.
   */
  async createProduct(input: CreateProductInput) {
    const baseSlug = toSlug(input.name);
    const existing = await this.repo.findProductBySlug(baseSlug);
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
    const ba_ref = input.ba_ref || `BA-${Math.floor(1000 + Math.random() * 9000)}`;
    const prefix = skuPrefix(input.name, ba_ref);

    const productId = await this.repo.createProduct({
      supplier_id: input.supplier_id ?? null,
      supplier_ref: input.supplier_ref ?? null,
      our_ref: input.our_ref ?? null,
      ba_ref,
      brand: input.brand ?? null,
      name: input.name,
      slug,
      description: input.description ?? null,
      status: input.status ?? 'draft',
      image_url: input.image_url ?? null,
      photos: input.photos ?? [],
    });

    // Attach categories
    await this.repo.setProductCategories(productId, input.category_ids, input.category_ids[0]);

    // Attach collections
    if (input.collection_ids && input.collection_ids.length > 0) {
      await this.repo.setProductCollections(productId, input.collection_ids);
    }

    // Seed default variant (replaced later when options are defined + generated)
    await this.repo.generateVariants(
      productId,
      input.seed_cost_price ?? 0,
      input.seed_selling_price ?? 0,
      input.seed_stock_quantity ?? 0,
      prefix,
    );

    return this.repo.findProductByIdWithVariants(productId);
  }

  async updateProduct(id: number, input: UpdateProductInput) {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw createApiError(404, `Product ${id} not found`);

    const payload: Record<string, any> = {};
    if (input.name) {
      payload['name'] = input.name;
      const targetSlug = toSlug(input.name);
      if (targetSlug !== existing.slug) {
        const otherWithSlug = await this.repo.findProductBySlug(targetSlug);
        if (otherWithSlug && Number(otherWithSlug.id) !== Number(id)) {
          payload['slug'] = `${targetSlug}-${Date.now()}`;
        } else {
          payload['slug'] = targetSlug;
        }
      }
    }
    if (input.supplier_id !== undefined) payload['supplier_id'] = input.supplier_id;
    if (input.supplier_ref !== undefined) payload['supplier_ref'] = input.supplier_ref;
    if (input.our_ref !== undefined) payload['our_ref'] = input.our_ref;
    if (input.brand !== undefined) payload['brand'] = input.brand;
    if (input.description !== undefined) payload['description'] = input.description;
    if (input.status) payload['status'] = input.status;
    if (input.image_url !== undefined) payload['image_url'] = input.image_url;
    if (input.photos !== undefined) payload['photos'] = input.photos;

    if (Object.keys(payload).length > 0) {
      await this.repo.updateProduct(id, payload);
    }

    if (input.category_ids && input.category_ids.length > 0) {
      await this.repo.setProductCategories(id, input.category_ids, input.category_ids[0]);
    }

    if (input.collection_ids !== undefined) {
      await this.repo.setProductCollections(id, input.collection_ids);
    }

    return this.repo.findProductByIdWithVariants(id);
  }

  async deleteProduct(id: number): Promise<void> {
    const existing = await this.repo.findProductById(id);
    if (!existing) throw createApiError(404, `Product ${id} not found`);
    await this.repo.deleteProduct(id);
  }

  // ── Options & Variants ────────────────────────────────────────────────────

  /**
   * POST /products/:id/options
   *
   * Attaches named option axes to a product. Option names must be unique
   * per product. Replaces any existing seed variant generated at creation.
   */
  async addOptions(productId: number, input: AddOptionsInput) {
    const product = await this.repo.findProductById(productId);
    if (!product) throw createApiError(404, `Product ${productId} not found`);

    // Guard: duplicate option names in this request
    const names = input.options.map((o) => o.name);
    if (new Set(names).size !== names.length) {
      throw createApiError(400, 'Option names must be unique within a single request');
    }

    return this.repo.createOptions(productId, input.options);
  }

  /**
   * POST /products/:id/variants/generate
   *
   * Computes the cartesian product of all option values and generates one
   * variant per combination. Clears any previously auto-generated draft
   * variants first so re-running is idempotent.
   *
   * Auto-assigns SKUs in the form: <PREFIX>-<VAL1>-<VAL2>
   */
  async generateVariants(productId: number) {
    const product = await this.repo.findProductByIdWithVariants(productId);
    if (!product) throw createApiError(404, `Product ${productId} not found`);

    // Remove existing draft variants that haven't been priced yet
    const db = (await import('../../config/db.js')).getDb();
    const existingVariants = await db('product_variants').where({ product_id: productId });
    const unPricedIds = existingVariants
      .filter((v: any) => Number(v.selling_price) === 0 && Number(v.cost_price) === 0)
      .map((v: any) => v.id);

    if (unPricedIds.length > 0) {
      await db('variant_option_values').whereIn('variant_id', unPricedIds).delete();
      await db('product_variants').whereIn('id', unPricedIds).delete();
    }

    const prefix = skuPrefix(product.name, product.ba_ref ?? null);
    const ids = await this.repo.generateVariants(productId, 0, 0, 0, prefix);

    return this.repo.findProductByIdWithVariants(productId);
  }

  // ── Variants ──────────────────────────────────────────────────────────────

  /**
   * PATCH /variants/:id
   *
   * Updates price, cost, stock fields on a single variant.
   * Variants are the sole source of truth for these values.
   */
  async patchVariant(variantId: number, productId: number | undefined, input: PatchVariantInput) {
    const variant = await this.repo.findVariantById(variantId);
    if (!variant) throw createApiError(404, `Variant ${variantId} not found`);

    // If caller scoped to a product, verify ownership
    if (productId !== undefined && variant.product_id !== productId) {
      throw createApiError(403, `Variant ${variantId} does not belong to product ${productId}`);
    }

    await this.repo.updateVariant(variantId, input);
    return this.repo.findVariantById(variantId);
  }

  async deleteVariant(variantId: number) {
    const variant = await this.repo.findVariantById(variantId);
    if (!variant) throw createApiError(404, `Variant ${variantId} not found`);

    const db = (await import('../../config/db.js')).getDb();
    await db('variant_option_values').where('variant_id', variantId).delete();
    await db('product_variants').where('id', variantId).delete();
    return true;
  }

  /**
   * POST /products/:id/publish
   *
   * Flips status to 'active'. Guards:
   * - Product must have at least one variant
   * - Every variant must have selling_price > 0
   */
  async publishProduct(productId: number) {
    const product = await this.repo.findProductByIdWithVariants(productId);
    if (!product) throw createApiError(404, `Product ${productId} not found`);
    if (product.status === 'active') throw createApiError(400, 'Product is already active');
    if (product.variants.length === 0) throw createApiError(400, 'Product has no variants — generate variants first');

    const unpriced = product.variants.filter((v) => Number(v.selling_price) <= 0);
    if (unpriced.length > 0) {
      throw createApiError(400,
        `${unpriced.length} variant(s) still have no selling price: ${unpriced.map((v) => v.sku).join(', ')}`
      );
    }

    await this.repo.updateProduct(productId, { status: 'active' });
    return this.repo.findProductByIdWithVariants(productId);
  }

  // ── Inventory ─────────────────────────────────────────────────────────────

  async getLowStockAlerts() {
    return this.repo.findLowStockAlerts();
  }
}
