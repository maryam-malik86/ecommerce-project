import { getDb } from '../../config/db.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  rank: number;
  children?: CategoryNode[];
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OptionWithValues {
  id: number;
  name: string;
  values: { id: number; value: string }[];
}

export interface VariantRow {
  id: number;
  product_id: number;
  sku: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url: string | null;
  display_label: string | null;
  option_values: { option: string; value: string }[];
}

export interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  brand: string | null;
  description: string | null;
  status: string;
  supplier_id: number | null;
  supplier_name: string | null;
  supplier_ref: string | null;
  our_ref: string | null;
  ba_ref: string | null;
  image_url: string | null;
  photos: string[];
  created_at: Date;
  updated_at: Date;
  categories: { id: number; name: string; is_primary: boolean }[];
  collections: { id: number; name: string }[];
  options: OptionWithValues[];
  variants: VariantRow[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Repository
// ─────────────────────────────────────────────────────────────────────────────

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

  async createSupplier(data: { name: string; country_code?: string; country_flag?: string; contact_email?: string; contact_phone?: string }): Promise<any> {
    const [id] = await this.db('suppliers').insert({
      name: data.name,
      country_code: data.country_code || 'US',
      country_flag: data.country_flag || '🇺🇸',
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
    });
    return this.db('suppliers').where('id', id).first();
  }

  // ── Categories ────────────────────────────────────────────────────────────

  /** Returns a flat list of all categories ordered for building a tree client-side. */
  async findAllCategoriesFlat(): Promise<CategoryNode[]> {
    return this.db('categories').orderBy('rank', 'asc').orderBy('name', 'asc') as Promise<CategoryNode[]>;
  }

  /**
   * Builds a nested category tree in application memory.
   * Supports unlimited depth — no fixed nesting limit in code.
   */
  async findCategoryTree(): Promise<CategoryNode[]> {
    const flat = await this.findAllCategoriesFlat();
    return buildTree(flat);
  }

  async findCategoryById(id: number): Promise<CategoryNode | undefined> {
    return this.db('categories').where({ id }).first() as Promise<CategoryNode | undefined>;
  }

  async createCategory(data: {
    name: string; slug: string; description?: string | null;
    parent_id?: number | null; rank?: number;
  }): Promise<number> {
    const [id] = await this.db('categories').insert({
      ...data,
      rank: data.rank ?? 0,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return id as number;
  }

  async updateCategory(id: number, data: Partial<CategoryNode>): Promise<void> {
    await this.db('categories').where({ id }).update({ ...data, updated_at: new Date() });
  }

  async deleteCategory(id: number): Promise<void> {
    // Re-parent children to this category's parent (or null)
    const cat = await this.findCategoryById(id);
    await this.db('categories').where({ parent_id: id }).update({ parent_id: cat?.parent_id ?? null });
    await this.db('categories').where({ id }).delete();
  }

  // ── Collections ───────────────────────────────────────────────────────────

  async findAllCollections(): Promise<Collection[]> {
    return this.db('collections').orderBy('name', 'asc') as Promise<Collection[]>;
  }

  async findCollectionById(id: number): Promise<Collection | undefined> {
    return this.db('collections').where({ id }).first() as Promise<Collection | undefined>;
  }

  async createCollection(data: { name: string; slug: string; description?: string | null }): Promise<number> {
    const [id] = await this.db('collections').insert({ ...data, created_at: new Date(), updated_at: new Date() });
    return id as number;
  }

  async updateCollection(id: number, data: Partial<Collection>): Promise<void> {
    await this.db('collections').where({ id }).update({ ...data, updated_at: new Date() });
  }

  async deleteCollection(id: number): Promise<void> {
    await this.db('product_collections').where({ collection_id: id }).delete();
    await this.db('collections').where({ id }).delete();
  }

  // ── Products ──────────────────────────────────────────────────────────────

  async findProducts(query: any): Promise<{ rows: any[]; total: number }> {
    const {
      page = 1, limit = 50, search, category_id, collection_id,
      supplier_id, status, brand,
      sort_by = 'created_at', sort_order = 'desc',
    } = query;
    const offset = (page - 1) * limit;

    // Use the v_catalog_products view when available, fall back to a manual join
    const hasView = await this.db.schema.hasTable('v_catalog_products');

    let q = this.db('products as p')
      .leftJoin('suppliers as s', 's.id', 'p.supplier_id')
      .leftJoin('product_categories as pc', (j) =>
        j.on('pc.product_id', 'p.id').andOnVal('pc.is_primary', true))
      .leftJoin('categories as c', 'c.id', 'pc.category_id')
      .leftJoin(
        this.db('product_variants').select('product_id')
          .min('selling_price as price_from')
          .max('selling_price as price_to')
          .sum('stock_quantity as total_stock')
          .count('id as variant_count')
          .groupBy('product_id')
          .as('vagg'),
        'vagg.product_id', 'p.id'
      )
      .select(
        'p.id', 'p.name', 'p.slug', 'p.brand', 'p.status',
        'p.supplier_id', 'p.supplier_ref', 'p.our_ref', 'p.ba_ref',
        'p.image_url', 'p.photos', 'p.created_at', 'p.updated_at',
        's.name as supplier_name',
        's.country_code as supplier_country_code',
        's.country_flag as supplier_country_flag',
        'c.name as primary_category',
        this.db.raw('COALESCE(vagg.variant_count, 0) as variant_count'),
        this.db.raw('COALESCE(vagg.price_from, 0) as price_from'),
        this.db.raw('COALESCE(vagg.price_to, 0) as price_to'),
        this.db.raw('COALESCE(vagg.total_stock, 0) as total_stock'),
      );

    if (search) {
      const term = `%${search}%`;
      q = q.where((b) => b
        .where('p.name', 'like', term)
        .orWhere('p.brand', 'like', term)
        .orWhere('p.supplier_ref', 'like', term)
        .orWhere('p.our_ref', 'like', term)
        .orWhere('p.ba_ref', 'like', term));
    }

    if (category_id) {
      q = q.whereExists(
        this.db('product_categories')
          .where('product_id', this.db.raw('p.id'))
          .where('category_id', category_id)
      );
    }

    if (collection_id) {
      q = q.whereExists(
        this.db('product_collections')
          .where('product_id', this.db.raw('p.id'))
          .where('collection_id', collection_id)
      );
    }

    if (supplier_id) q = q.where('p.supplier_id', supplier_id);
    if (status) q = q.where('p.status', status);
    if (brand) q = q.where('p.brand', brand);

    // Count query (no pagination)
    const countQ = this.db('products as p')
      .modify((b) => {
        if (category_id) b.whereExists(
          this.db('product_categories')
            .where('product_id', this.db.raw('p.id'))
            .where('category_id', category_id)
        );
        if (collection_id) b.whereExists(
          this.db('product_collections')
            .where('product_id', this.db.raw('p.id'))
            .where('collection_id', collection_id)
        );
        if (supplier_id) b.where('p.supplier_id', supplier_id);
        if (status) b.where('p.status', status);
        if (brand) b.where('p.brand', brand);
        if (search) {
          const term = `%${search}%`;
          b.where((inner) => inner
            .where('p.name', 'like', term)
            .orWhere('p.brand', 'like', term)
            .orWhere('p.supplier_ref', 'like', term));
        }
      })
      .count('* as count');

    const [{ count }] = await countQ;

    const sortColumn = sort_by === 'price_from' ? 'vagg.price_from'
      : sort_by === 'total_stock' ? 'vagg.total_stock'
      : `p.${sort_by}`;

    const rows = await q.orderBy(sortColumn, sort_order).limit(limit).offset(offset);

    const productIds = rows.map((r: any) => r.id);
    const variantOptionsMap = new Map<number, any[]>();

    if (productIds.length > 0) {
      const variants = await this.db('product_variants').whereIn('product_id', productIds);
      const vows = await this.db('variant_option_values as vov')
        .join('product_option_values as ov', 'ov.id', 'vov.option_value_id')
        .join('product_options as po', 'po.id', 'ov.option_id')
        .whereIn('vov.variant_id', variants.map((v) => v.id))
        .select('vov.variant_id', 'po.name as option', 'ov.value as value');

      const vowMap = new Map<number, any[]>();
      for (const vow of vows) {
        if (!vowMap.has(vow.variant_id)) vowMap.set(vow.variant_id, []);
        vowMap.get(vow.variant_id)!.push(vow);
      }

      for (const v of variants) {
        const links = vowMap.get(v.id) || [];
        const label = links.map((l) => l.value).join(' / ') || 'Standard';
        const item = {
          ...v,
          cost_price: Number(v.cost_price),
          selling_price: Number(v.selling_price),
          label,
        };
        if (!variantOptionsMap.has(v.product_id)) variantOptionsMap.set(v.product_id, []);
        variantOptionsMap.get(v.product_id)!.push(item);
      }
    }

    const parsedRows = rows.map((r: any) => ({
      ...parseProductRow(r),
      variants: variantOptionsMap.get(r.id) || [],
    }));

    return { rows: parsedRows, total: Number(count) };
  }

  async findProductBySlug(slug: string): Promise<any> {
    return this.db('products').where({ slug }).first();
  }

  async findProductById(id: number): Promise<any> {
    return this.db('products').where({ id }).first();
  }

  async findProductByIdWithVariants(id: number): Promise<ProductDetail | undefined> {
    const product = await this.db('products as p')
      .leftJoin('suppliers as s', 's.id', 'p.supplier_id')
      .select(
        'p.*',
        's.name as supplier_name',
        's.country_code as supplier_country_code',
        's.country_flag as supplier_country_flag',
      )
      .where('p.id', id)
      .first();

    if (!product) return undefined;

    // Categories
    const categories = await this.db('product_categories as pc')
      .join('categories as c', 'c.id', 'pc.category_id')
      .where('pc.product_id', id)
      .select('c.id', 'c.name', 'pc.is_primary');

    // Collections
    const collections = await this.db('product_collections as pcol')
      .join('collections as col', 'col.id', 'pcol.collection_id')
      .where('pcol.product_id', id)
      .select('col.id', 'col.name');

    // Options + values
    const optionRows = await this.db('product_options as po')
      .join('product_option_values as ov', 'ov.option_id', 'po.id')
      .where('po.product_id', id)
      .select('po.id as option_id', 'po.name as option_name', 'ov.id as value_id', 'ov.value')
      .orderBy('po.id');

    const optionsMap = new Map<number, OptionWithValues>();
    for (const row of optionRows) {
      if (!optionsMap.has(row.option_id)) {
        optionsMap.set(row.option_id, { id: row.option_id, name: row.option_name, values: [] });
      }
      optionsMap.get(row.option_id)!.values.push({ id: row.value_id, value: row.value });
    }

    // Variants with their option values
    const variantRows = await this.db('product_variants').where({ product_id: id });
    const variants: VariantRow[] = [];

    for (const v of variantRows) {
      const ovLinks = await this.db('variant_option_values as vov')
        .join('product_option_values as ov', 'ov.id', 'vov.option_value_id')
        .join('product_options as po', 'po.id', 'ov.option_id')
        .where('vov.variant_id', v.id)
        .select('po.name as option', 'ov.value')
        .orderBy('po.id');

      const displayLabel = ovLinks.map((o: any) => o.value).join(' / ') || 'Standard';

      variants.push({
        id: v.id,
        product_id: v.product_id,
        sku: v.sku,
        cost_price: Number(v.cost_price),
        selling_price: Number(v.selling_price),
        stock_quantity: v.stock_quantity,
        low_stock_threshold: v.low_stock_threshold,
        image_url: v.image_url,
        display_label: displayLabel,
        option_values: ovLinks,
      });
    }

    return {
      ...parseProductRow(product),
      categories,
      collections,
      options: [...optionsMap.values()],
      variants,
    } as ProductDetail;
  }

  async createProduct(data: any): Promise<number> {
    const payload = {
      ...data,
      photos: data.photos ? JSON.stringify(data.photos) : JSON.stringify([]),
      created_at: new Date(),
      updated_at: new Date(),
    };
    const [id] = await this.db('products').insert(payload);
    return id as number;
  }

  async updateProduct(id: number, data: any): Promise<void> {
    const payload = { ...data, updated_at: new Date() };
    if (Array.isArray(data.photos)) payload.photos = JSON.stringify(data.photos);
    await this.db('products').where({ id }).update(payload);
  }

  async deleteProduct(id: number): Promise<void> {
    const variants = await this.db('product_variants').where({ product_id: id });
    const variantIds = variants.map((v) => v.id);

    if (variantIds.length > 0) {
      const res = await this.db('order_items').whereIn('variant_id', variantIds).count('* as total');
      const total = Number((res[0] as any)?.total ?? 0);
      if (total > 0) {
        // Has order history — archive instead of delete
        await this.db('products').where({ id }).update({ status: 'archived', updated_at: new Date() });
        return;
      }
      await this.db('variant_option_values').whereIn('variant_id', variantIds).delete();
      await this.db('stock_movements').whereIn('variant_id', variantIds).delete();
      await this.db('cart_items').whereIn('variant_id', variantIds).delete();
      await this.db('stock_reservations').whereIn('variant_id', variantIds).delete();
      await this.db('product_variants').where({ product_id: id }).delete();
    }

    await this.db('product_categories').where({ product_id: id }).delete();
    await this.db('product_collections').where({ product_id: id }).delete();
    await this.db('products').where({ id }).delete();
  }

  // ── Product ↔ Category / Collection links ─────────────────────────────────

  async setProductCategories(productId: number, categoryIds: number[], primaryId?: number): Promise<void> {
    await this.db('product_categories').where({ product_id: productId }).delete();
    if (categoryIds.length === 0) return;
    const rows = categoryIds.map((cid) => ({
      product_id: productId,
      category_id: cid,
      is_primary: cid === (primaryId ?? categoryIds[0]),
    }));
    await this.db('product_categories').insert(rows);
  }

  async setProductCollections(productId: number, collectionIds: number[]): Promise<void> {
    await this.db('product_collections').where({ product_id: productId }).delete();
    if (collectionIds.length === 0) return;
    const rows = collectionIds.map((cid) => ({ product_id: productId, collection_id: cid }));
    await this.db('product_collections').insert(rows);
  }

  // ── Options + Variants ────────────────────────────────────────────────────

  async createOptions(productId: number, options: { name: string; values: string[] }[]): Promise<OptionWithValues[]> {
    const result: OptionWithValues[] = [];

    for (const opt of options) {
      const [optionId] = await this.db('product_options').insert({
        product_id: productId,
        name: opt.name,
      });

      const valRows = opt.values.map((v) => ({
        option_id: optionId,
        value: v,
      }));
      await this.db('product_option_values').insert(valRows);
      const insertedValues = await this.db('product_option_values').where({ option_id: optionId });

      result.push({
        id: optionId as number,
        name: opt.name,
        values: insertedValues.map((v) => ({ id: v.id, value: v.value })),
      });
    }

    return result;
  }

  /**
   * Generates variants as the cartesian product of option values.
   * If no options exist, creates a single default "Standard" variant.
   */
  async generateVariants(
    productId: number,
    seedCostPrice: number,
    seedSellingPrice: number,
    seedStockQty: number,
    skuPrefix: string,
  ): Promise<number[]> {
    // Fetch all options+values for this product
    const optionRows = await this.db('product_options as po')
      .join('product_option_values as ov', 'ov.option_id', 'po.id')
      .where('po.product_id', productId)
      .select('po.id as option_id', 'po.name as option_name', 'ov.id as value_id', 'ov.value')
      .orderBy('po.id');

    // Group by option
    const optionMap = new Map<number, { name: string; values: { id: number; value: string }[] }>();
    for (const row of optionRows) {
      if (!optionMap.has(row.option_id)) optionMap.set(row.option_id, { name: row.option_name, values: [] });
      optionMap.get(row.option_id)!.values.push({ id: row.value_id, value: row.value });
    }

    const optionGroups = [...optionMap.values()];
    const createdIds: number[] = [];

    if (optionGroups.length === 0) {
      // No options → single default variant
      const sku = `${skuPrefix}-STD`;
      const [id] = await this.db('product_variants').insert({
        product_id: productId,
        sku,
        cost_price: seedCostPrice,
        selling_price: seedSellingPrice,
        stock_quantity: seedStockQty,
        low_stock_threshold: 5,
        image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      createdIds.push(id as number);
      return createdIds;
    }

    // Cartesian product
    const combinations = cartesian(optionGroups.map((g) => g.values));

    for (const combo of combinations) {
      const skuSuffix = combo.map((v) => v.value.toUpperCase().replace(/\s+/g, '').slice(0, 4)).join('-');
      const sku = `${skuPrefix}-${skuSuffix}`;

      const [variantId] = await this.db('product_variants').insert({
        product_id: productId,
        sku,
        cost_price: seedCostPrice,
        selling_price: seedSellingPrice,
        stock_quantity: seedStockQty,
        low_stock_threshold: 5,
        image_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const vowRows = combo.map((v) => ({ variant_id: variantId, option_value_id: v.id }));
      await this.db('variant_option_values').insert(vowRows);
      createdIds.push(variantId as number);
    }

    return createdIds;
  }

  async findVariantById(id: number): Promise<any> {
    return this.db('product_variants').where({ id }).first();
  }

  async updateVariant(id: number, data: any): Promise<void> {
    await this.db('product_variants').where({ id }).update({ ...data, updated_at: new Date() });
  }

  // ── Low-stock view ─────────────────────────────────────────────────────────

  async findLowStockAlerts(): Promise<any[]> {
    return this.db('product_variants as pv')
      .join('products as p', 'p.id', 'pv.product_id')
      .whereRaw('pv.stock_quantity <= pv.low_stock_threshold')
      .select(
        'pv.id as variant_id',
        'pv.sku',
        'p.name as product_name',
        'p.id as product_id',
        'pv.stock_quantity',
        'pv.low_stock_threshold',
      )
      .orderBy('pv.stock_quantity', 'asc');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Recursively builds a tree from a flat list using parent_id. */
function buildTree(flat: CategoryNode[], parentId: number | null = null): CategoryNode[] {
  return flat
    .filter((n) => n.parent_id === parentId)
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .map((n) => ({ ...n, children: buildTree(flat, n.id) }));
}

/** Computes the cartesian product of an array of arrays. */
function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]] as T[][],
  );
}

function parseProductRow(p: any): any {
  let photos = p.photos;
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch { photos = []; }
  }
  return {
    ...p,
    photos: Array.isArray(photos) ? photos : [],
    supplier: p.supplier_id ? {
      id: p.supplier_id,
      name: p.supplier_name || null,
      country_code: p.supplier_country_code || null,
      country_flag: p.supplier_country_flag || null,
    } : null,
  };
}
