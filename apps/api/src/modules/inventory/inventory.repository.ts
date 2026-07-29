import { getDb } from '../../config/db.js';
import type { StockMovement, Supplier, LowStockAlert } from '@ecommerce/shared-types';

export class InventoryRepository {
  private get db() {
    return getDb();
  }

  // ── Suppliers ───────────────────────────────────────────────────────────────

  async findAllSuppliers(): Promise<Supplier[]> {
    return this.db('suppliers').orderBy('name') as Promise<Supplier[]>;
  }

  async findSupplierById(id: number): Promise<Supplier | undefined> {
    return this.db('suppliers').where({ id }).first() as Promise<Supplier | undefined>;
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const [id] = await this.db('suppliers').insert({ ...data, created_at: new Date(), updated_at: new Date() });
    return id as number;
  }

  async updateSupplier(id: number, data: Partial<Supplier>): Promise<void> {
    await this.db('suppliers').where({ id }).update({ ...data, updated_at: new Date() });
  }

  // ── Stock Movements ─────────────────────────────────────────────────────────

  async createMovement(
    data: Omit<StockMovement, 'id' | 'created_at'>,
    trx?: Parameters<typeof this.db.transaction>[0],
  ): Promise<number> {
    const builder = trx ? this.db('stock_movements').transacting(trx as any) : this.db('stock_movements');
    const [id] = await builder.insert({ ...data, created_at: new Date() });
    return id as number;
  }

  async findMovementsByVariant(variantId: number, limit = 50): Promise<StockMovement[]> {
    return this.db('stock_movements')
      .where({ variant_id: variantId })
      .orderBy('created_at', 'desc')
      .limit(limit) as Promise<StockMovement[]>;
  }

  // Update the stock_quantity on the variant directly (called within a transaction)
  async adjustVariantStock(
    variantId: number,
    delta: number,
    trx?: any,
  ): Promise<void> {
    const builder = trx
      ? this.db('product_variants').transacting(trx)
      : this.db('product_variants');

    await builder.where({ id: variantId }).increment('stock_quantity', delta);
  }

  // ── Low Stock Alerts ────────────────────────────────────────────────────────

  async findLowStockVariants(): Promise<LowStockAlert[]> {
    return this.db('product_variants')
      .join('products', 'product_variants.product_id', 'products.id')
      .select(
        'product_variants.id as variant_id',
        'product_variants.sku',
        'product_variants.option_label',
        'products.name as product_name',
        'product_variants.stock_quantity',
        'product_variants.low_stock_threshold',
      )
      .whereRaw('product_variants.stock_quantity <= product_variants.low_stock_threshold')
      .orderBy('product_variants.stock_quantity', 'asc') as Promise<LowStockAlert[]>;
  }
}
