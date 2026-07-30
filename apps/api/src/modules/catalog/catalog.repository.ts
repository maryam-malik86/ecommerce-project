import { getDb } from '../../config/db.js';
import type { Product, ProductVariant, Category } from '@ecommerce/shared-types';
import type { ProductQueryInput } from './catalog.schemas.js';

export class CatalogRepository {
  private get db() {
    return getDb();
  }

  // ── Categories ──────────────────────────────────────────────────────────────

  async findAllCategories(): Promise<Category[]> {
    return this.db('categories').orderBy('name', 'asc') as Promise<Category[]>;
  }

  async findCategoryById(id: number): Promise<Category | undefined> {
    return this.db('categories').where({ id }).first() as Promise<Category | undefined>;
  }

  async createCategory(data: Partial<Category>): Promise<number> {
    const [id] = await this.db('categories').insert({ ...data, created_at: new Date(), updated_at: new Date() });
    return id as number;
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<void> {
    await this.db('categories').where({ id }).update({ ...data, updated_at: new Date() });
  }

  async deleteCategory(id: number): Promise<void> {
    // Unlink products or re-assign to another category
    const fallback = await this.db('categories').whereNot({ id }).first();
    const fallbackId = fallback ? fallback.id : null;

    await this.db('products').where({ category_id: id }).update({ category_id: fallbackId });
    await this.db('categories').where({ parent_id: id }).update({ parent_id: null });
    await this.db('categories').where({ id }).delete();
  }

  // ── Products ────────────────────────────────────────────────────────────────

  async findProducts(query: ProductQueryInput): Promise<{ rows: Product[]; total: number }> {
    const { page, limit, search, category_id, status, sort_by, sort_order } = query;
    const offset = (page - 1) * limit;

    let q = this.db('products').select('products.*');

    if (search) {
      q = q.whereILike('products.name', `%${search}%`);
    }
    if (category_id) {
      q = q.where('products.category_id', category_id);
    }
    if (status) {
      q = q.where('products.status', status);
    }

    const [{ count }] = await this.db('products')
      .count('* as count')
      .modify((b: ReturnType<typeof this.db>) => {
        if (search) b.whereILike('name', `%${search}%`);
        if (category_id) b.where('category_id', category_id);
        if (status) b.where('status', status);
      });

    const rows = await q.orderBy(sort_by, sort_order).limit(limit).offset(offset);

    return { rows: rows as Product[], total: Number(count) };
  }

  async findProductByIdWithVariants(id: number) {
    const product = await this.db('products')
      .join('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
      )
      .where('products.id', id)
      .first();

    if (!product) return undefined;

    const variants = await this.db('product_variants').where({ product_id: id });

    return { ...product, variants };
  }

  async findProductBySlug(slug: string) {
    return this.db('products').where({ slug }).first();
  }

  async createProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [id] = await this.db('products').insert({ ...data, created_at: new Date(), updated_at: new Date() });
    return id as number;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<void> {
    await this.db('products').where({ id }).update({ ...data, updated_at: new Date() });
  }

  async deleteProduct(id: number): Promise<void> {
    const variants = await this.db('product_variants').where({ product_id: id });
    const variantIds = variants.map((v) => v.id);

    if (variantIds.length > 0) {
      // Check if variants have been purchased in orders
      const res = await this.db('order_items').whereIn('variant_id', variantIds).count('* as total');
      const total = Number((res[0] as any)?.total ?? 0);
      if (total > 0) {
        // If ordered, soft-archive the product to preserve historical invoice records
        await this.db('products').where({ id }).update({ status: 'archived', updated_at: new Date() });
        return;
      }
      // Safe to hard delete unpurchased variants and movements
      await this.db('stock_movements').whereIn('variant_id', variantIds).delete();
      await this.db('cart_items').whereIn('variant_id', variantIds).delete();
      await this.db('stock_reservations').whereIn('variant_id', variantIds).delete();
      await this.db('product_variants').where({ product_id: id }).delete();
    }

    await this.db('product_images').where({ product_id: id }).delete();
    await this.db('products').where({ id }).delete();
  }

  // ── Variants ────────────────────────────────────────────────────────────────

  async createVariant(data: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [id] = await this.db('product_variants').insert({ ...data, created_at: new Date(), updated_at: new Date() });
    return id as number;
  }

  async findVariantById(id: number): Promise<ProductVariant | undefined> {
    return this.db('product_variants').where({ id }).first() as Promise<ProductVariant | undefined>;
  }

  async updateVariant(id: number, data: Partial<ProductVariant>): Promise<void> {
    await this.db('product_variants').where({ id }).update({ ...data, updated_at: new Date() });
  }
}
