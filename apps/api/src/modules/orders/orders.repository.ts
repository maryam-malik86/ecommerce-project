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
    let shippingJson: string;
    if (typeof data.shipping_address === 'string') {
      try {
        JSON.parse(data.shipping_address);
        shippingJson = data.shipping_address;
      } catch {
        shippingJson = JSON.stringify({ address: data.shipping_address });
      }
    } else {
      shippingJson = JSON.stringify(data.shipping_address);
    }

    const [id] = await trx('orders').insert({
      ...data,
      shipping_address: shippingJson,
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
    const { page, limit, status, payment_status, user_id, search, sort } = query;
    const offset = (page - 1) * limit;

    const applyFilters = (b: any) => {
      if (status) b.where('orders.status', status);
      if (payment_status) b.where('orders.payment_status', payment_status);
      if (user_id) b.where('orders.user_id', user_id);
      if (search) {
        const term = `%${search.trim().toLowerCase()}%`;
        b.where((builder: any) => {
          builder
            .whereRaw('CAST(orders.id AS CHAR) LIKE ?', [term])
            .orWhereILike('orders.order_number', term)
            .orWhereILike('users.name', term)
            .orWhereILike('users.email', term);
        });
      }
    };

    const countQuery = this.db('orders')
      .leftJoin('users', 'orders.user_id', 'users.id')
      .modify(applyFilters)
      .count('* as count')
      .first();

    let dataQuery = this.db('orders')
      .leftJoin('users', 'orders.user_id', 'users.id')
      .select('orders.*', 'users.name as user_name', 'users.email as user_email')
      .modify(applyFilters);

    if (sort === 'oldest') {
      dataQuery = dataQuery.orderBy('orders.created_at', 'asc');
    } else if (sort === 'amount_high') {
      dataQuery = dataQuery.orderBy('orders.total_amount', 'desc');
    } else if (sort === 'amount_low') {
      dataQuery = dataQuery.orderBy('orders.total_amount', 'asc');
    } else {
      dataQuery = dataQuery.orderBy('orders.created_at', 'desc');
    }

    const [{ count }] = await Promise.all([countQuery]) as any;
    const rows = await dataQuery.limit(limit).offset(offset);

    return { rows: rows as Order[], total: Number(count?.count ?? 0) };
  }

  async findOrderById(id: number, dbClient: Knex | Knex.Transaction = this.db): Promise<OrderWithItems | undefined> {
    const order = await dbClient('orders')
      .leftJoin('users', 'orders.user_id', 'users.id')
      .select('orders.*', 'users.name as user_name', 'users.email as user_email')
      .where('orders.id', id)
      .first();

    if (!order) return undefined;

    const items = await dbClient('order_items')
      .join('product_variants', 'order_items.variant_id', 'product_variants.id')
      .join('products', 'product_variants.product_id', 'products.id')
      .leftJoin('v_variant_display', 'v_variant_display.variant_id', 'product_variants.id')
      .select(
        'order_items.*',
        'products.name as product_name',
        'product_variants.sku as variant_sku',
        dbClient.raw('COALESCE(v_variant_display.display_label, product_variants.sku) as variant_label'),
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

  async bulkUpdateOrderStatus(
    ids: number[],
    data: { status: string; payment_status?: string },
  ): Promise<void> {
    await this.db('orders').whereIn('id', ids).update({ ...data, updated_at: new Date() });
  }

  async bulkDeleteOrders(ids: number[]): Promise<void> {
    await this.db('order_items').whereIn('order_id', ids).delete();
    await this.db('orders').whereIn('id', ids).delete();
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

