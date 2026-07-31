import { getDb } from '../../config/db.js';
import type { Product, ProductVariant, Category } from '@ecommerce/shared-types';

export class CatalogRepository {
  private get db() {
    return getDb();
  }

  // ── Suppliers ─────────────────────────────────────────────────────────────

  async findAllSuppliers(): Promise<any[]> {
    const hasTable = await this.db.schema.hasTable('suppliers');
    if (!hasTable) return [];
    return this.db('suppliers').orderBy('name', 'asc');
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
    const fallback = await this.db('categories').whereNot({ id }).first();
    const fallbackId = fallback ? fallback.id : null;

    await this.db('products').where({ category_id: id }).update({ category_id: fallbackId });
    await this.db('categories').where({ parent_id: id }).update({ parent_id: null });
    await this.db('categories').where({ id }).delete();
  }

  // ── Products / Items ────────────────────────────────────────────────────────

  async findProducts(query: any): Promise<{ rows: any[]; total: number }> {
    const { page = 1, limit = 50, search, category_id, supplier_id, status, brand, department, sort_by = 'created_at', sort_order = 'desc' } = query;
    const offset = (page - 1) * limit;

    let q = this.db('products')
      .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .select(
        'products.*',
        'suppliers.name as supplier_name',
        'suppliers.country_code as supplier_country_code',
        'suppliers.country_flag as supplier_country_flag',
        'categories.name as category_name'
      );

    if (search) {
      const term = `%${search}%`;
      q = q.where((builder) => {
        builder.where('products.name', 'like', term)
          .orWhere('products.supplier_ref', 'like', term)
          .orWhere('products.our_ref', 'like', term)
          .orWhere('products.ba_ref', 'like', term)
          .orWhere('products.department', 'like', term)
          .orWhere('products.brand', 'like', term);
      });
    }

    if (category_id) q = q.where('products.category_id', category_id);
    if (supplier_id) q = q.where('products.supplier_id', supplier_id);
    if (status) q = q.where('products.status', status);
    if (brand) q = q.where('products.brand', brand);
    if (department) q = q.where('products.department', department);

    const [{ count }] = await this.db('products')
      .count('* as count')
      .modify((b: ReturnType<typeof this.db>) => {
        if (search) {
          const term = `%${search}%`;
          b.where((builder) => {
            builder.where('name', 'like', term)
              .orWhere('supplier_ref', 'like', term)
              .orWhere('department', 'like', term)
              .orWhere('brand', 'like', term);
          });
        }
        if (category_id) b.where('category_id', category_id);
        if (supplier_id) b.where('supplier_id', supplier_id);
        if (status) b.where('status', status);
      });

    const rows = await q.orderBy(`products.${sort_by}`, sort_order).limit(limit).offset(offset);

    // Format JSON fields cleanly
    const formatted = rows.map((r) => parseProductJson(r));

    return { rows: formatted, total: Number(count) };
  }

  async findProductByIdWithVariants(id: number) {
    const product = await this.db('products')
      .leftJoin('categories', 'products.category_id', 'categories.id')
      .leftJoin('suppliers', 'products.supplier_id', 'suppliers.id')
      .select(
        'products.*',
        'categories.name as category_name',
        'categories.slug as category_slug',
        'suppliers.name as supplier_name',
        'suppliers.country_code as supplier_country_code',
        'suppliers.country_flag as supplier_country_flag'
      )
      .where('products.id', id)
      .first();

    if (!product) return undefined;

    const variants = await this.db('product_variants').where({ product_id: id });
    const formatted = parseProductJson(product);

    return { ...formatted, variants };
  }

  async findProductBySlug(slug: string) {
    return this.db('products').where({ slug }).first();
  }

  async createProduct(data: any): Promise<number> {
    const payload = {
      ...data,
      colors: data.colors ? JSON.stringify(data.colors) : null,
      materials: data.materials ? JSON.stringify(data.materials) : null,
      photos: data.photos ? JSON.stringify(data.photos) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const [id] = await this.db('products').insert(payload);
    return id as number;
  }

  async updateProduct(id: number, data: any): Promise<void> {
    const payload = { ...data, updated_at: new Date() };
    if (data.colors) payload.colors = JSON.stringify(data.colors);
    if (data.materials) payload.materials = JSON.stringify(data.materials);
    if (data.photos) payload.photos = JSON.stringify(data.photos);

    await this.db('products').where({ id }).update(payload);
  }

  async deleteProduct(id: number): Promise<void> {
    const variants = await this.db('product_variants').where({ product_id: id });
    const variantIds = variants.map((v) => v.id);

    if (variantIds.length > 0) {
      const res = await this.db('order_items').whereIn('variant_id', variantIds).count('* as total');
      const total = Number((res[0] as any)?.total ?? 0);
      if (total > 0) {
        await this.db('products').where({ id }).update({ status: 'archived', updated_at: new Date() });
        return;
      }
      await this.db('stock_movements').whereIn('variant_id', variantIds).delete();
      await this.db('cart_items').whereIn('variant_id', variantIds).delete();
      await this.db('stock_reservations').whereIn('variant_id', variantIds).delete();
      await this.db('product_variants').where({ product_id: id }).delete();
    }

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

function parseProductJson(p: any): any {
  if (!p) return p;
  let colors = p.colors;
  let materials = p.materials;
  let photos = p.photos;

  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch (_e) { colors = []; }
  }
  if (typeof materials === 'string') {
    try { materials = JSON.parse(materials); } catch (_e) { materials = []; }
  }
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch (_e) { photos = []; }
  }

  return {
    ...p,
    colors: colors || [],
    materials: materials || [],
    photos: photos || [],
    supplier: p.supplier_id ? {
      id: p.supplier_id,
      name: p.supplier_name || 'Supplier',
      country_code: p.supplier_country_code || 'US',
      country_flag: p.supplier_country_flag || '🇺🇸',
    } : null,
  };
}
