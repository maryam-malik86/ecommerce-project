import { getDb } from '../../config/db.js';
import type { ProfitSummary, ProfitByProduct } from '@ecommerce/shared-types';

export class AnalyticsRepository {
  private get db() {
    return getDb();
  }

  // ── Net Profit Summary ─────────────────────────────────────────────────────
  // Formula: SUM( (unit_selling_price - unit_cost_price) * quantity )
  // Uses snapshotted prices in order_items for historical accuracy.

  async getProfitSummary(from: string, to: string): Promise<ProfitSummary> {
    const [result] = await this.db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .whereBetween('orders.created_at', [from, to])
      .whereNotIn('orders.status', ['cancelled', 'refunded'])
      .select(
        this.db.raw(`
          SUM(order_items.unit_selling_price * order_items.quantity) AS total_revenue,
          SUM(order_items.unit_cost_price * order_items.quantity)    AS total_cost,
          SUM((order_items.unit_selling_price - order_items.unit_cost_price) * order_items.quantity) AS net_profit,
          COUNT(DISTINCT orders.id)                                  AS total_orders,
          SUM(order_items.quantity)                                  AS total_items_sold,
          AVG(orders.total_amount)                                   AS avg_order_value
        `),
      );

    return {
      period_start: from,
      period_end: to,
      total_revenue: Number(result?.total_revenue ?? 0),
      total_cost: Number(result?.total_cost ?? 0),
      net_profit: Number(result?.net_profit ?? 0),
      total_orders: Number(result?.total_orders ?? 0),
      total_items_sold: Number(result?.total_items_sold ?? 0),
      avg_order_value: Number(result?.avg_order_value ?? 0),
    };
  }

  async getProfitByProduct(from: string, to: string): Promise<ProfitByProduct[]> {
    const rows = await this.db('order_items')
      .join('orders', 'order_items.order_id', 'orders.id')
      .join('product_variants', 'order_items.variant_id', 'product_variants.id')
      .join('products', 'product_variants.product_id', 'products.id')
      .whereBetween('orders.created_at', [from, to])
      .whereNotIn('orders.status', ['cancelled', 'refunded'])
      .groupBy('products.id', 'products.name')
      .select(
        'products.id as product_id',
        'products.name as product_name',
        this.db.raw(`
          SUM(order_items.unit_selling_price * order_items.quantity) AS total_revenue,
          SUM(order_items.unit_cost_price * order_items.quantity)    AS total_cost,
          SUM((order_items.unit_selling_price - order_items.unit_cost_price) * order_items.quantity) AS net_profit,
          SUM(order_items.quantity)                                  AS units_sold
        `),
      )
      .orderBy('net_profit', 'desc');

    return rows.map((r: any) => ({
      product_id: r.product_id as number,
      product_name: r.product_name as string,
      total_revenue: Number(r.total_revenue),
      total_cost: Number(r.total_cost),
      net_profit: Number(r.net_profit),
      units_sold: Number(r.units_sold),
    }));
  }

  async getRevenueTimeSeries(from: string, to: string, groupBy: 'day' | 'month' = 'day') {
    const dateFormat = groupBy === 'day' ? '%Y-%m-%d' : '%Y-%m';

    return this.db('orders')
      .join('order_items', 'orders.id', 'order_items.order_id')
      .whereBetween('orders.created_at', [from, to])
      .whereNotIn('orders.status', ['cancelled', 'refunded'])
      .groupByRaw(`DATE_FORMAT(orders.created_at, '${dateFormat}')`)
      .select(
        this.db.raw(`DATE_FORMAT(orders.created_at, '${dateFormat}') as period`),
        this.db.raw(`SUM(order_items.unit_selling_price * order_items.quantity) as revenue`),
        this.db.raw(`SUM((order_items.unit_selling_price - order_items.unit_cost_price) * order_items.quantity) as profit`),
        this.db.raw(`COUNT(DISTINCT orders.id) as order_count`),
      )
      .orderBy('period', 'asc');
  }
}
