import type { Knex } from 'knex';
import { getDb } from '../../config/db.js';
import type { Order, OrderItem, OrderWithItems } from '@ecommerce/shared-types';
import type { OrderQueryInput } from './orders.schemas.js';

export class OrdersRepository {
  private get db() {
    return getDb();
  }

  // ── Variants (for price snapshotting) ──────────────────────────────────────

  async findVariantForUpdate(
    variantId: number,
    trx: Knex.Transaction,
  ): Promise<{ id: number; stock_quantity: number; cost_price: number; selling_price: number } | undefined> {
    // SELECT ... FOR UPDATE locks the row inside the transaction to prevent race conditions
    return trx('product_variants')
      .where({ id: variantId })
      .forUpdate()
      .first() as Promise<any>;
  }

  // ── Orders ─────────────────────────────────────────────────────────────────

  async createOrder(
    data: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
    trx: Knex.Transaction,
  ): Promise<number> {
    const [id] = await trx('orders').insert({
      ...data,
      shipping_address: JSON.stringify(data.shipping_address),
      created_at: new Date(),
      updated_at: new Date(),
    });
    return id as number;
  }

  async createOrderItems(
    items: Omit<OrderItem, 'id'>[],
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('order_items').insert(items);
  }

  async updateVariantStock(
    variantId: number,
    delta: number,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('product_variants').where({ id: variantId }).increment('stock_quantity', delta);
  }

  async createStockMovement(
    data: {
      variant_id: number;
      order_id: number;
      type: string;
      quantity: number;
      note: string;
    },
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('stock_movements').insert({ ...data, supplier_id: null, created_at: new Date() });
  }

  async findOrders(query: OrderQueryInput): Promise<{ rows: Order[]; total: number }> {
    const { page, limit, status, user_id } = query;
    const offset = (page - 1) * limit;

    let q = this.db('orders').select('orders.*');
    if (status) q = q.where('orders.status', status);
    if (user_id) q = q.where('orders.user_id', user_id);

    const [{ count }] = await this.db('orders').count('* as count').modify((b: ReturnType<typeof this.db>) => {
      if (status) b.where('status', status);
      if (user_id) b.where('user_id', user_id);
    });

    const rows = await q.orderBy('orders.created_at', 'desc').limit(limit).offset(offset);

    return { rows: rows as Order[], total: Number(count) };
  }

  async findOrderById(id: number): Promise<OrderWithItems | undefined> {
    const order = await this.db('orders').where({ id }).first();
    if (!order) return undefined;

    const items = await this.db('order_items')
      .join('product_variants', 'order_items.variant_id', 'product_variants.id')
      .select(
        'order_items.*',
        'product_variants.sku as variant_sku',
        'product_variants.option_label as variant_label',
      )
      .where('order_items.order_id', id);

    return { ...order, items } as OrderWithItems;
  }

  async updateOrderStatus(
    id: number,
    data: { status?: string; payment_status?: string },
  ): Promise<void> {
    await this.db('orders').where({ id }).update({ ...data, updated_at: new Date() });
  }

  async confirmReservations(orderId: number, trx: Knex.Transaction): Promise<void> {
    await trx('stock_reservations')
      .where({ order_id: orderId, status: 'pending' })
      .update({ status: 'confirmed' });
  }

  async deleteOrder(id: number): Promise<void> {
    await this.db('order_items').where({ order_id: id }).delete();
    await this.db('orders').where({ id }).delete();
  }
}
