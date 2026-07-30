import type { Knex } from 'knex';
import { getDb } from '../../config/db.js';
import { OrdersRepository } from './orders.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { CreateOrderInput, UpdateOrderStatusInput, OrderQueryInput } from './orders.schemas.js';
import type { PaginatedResponse, OrderWithItems } from '@ecommerce/shared-types';

export class OrdersService {
  private repo = new OrdersRepository();

  // ── Checkout (MySQL Transaction) ───────────────────────────────────────────
  //
  // The checkout flow runs entirely inside a single MySQL transaction:
  //
  //  1. For each item: SELECT variant FOR UPDATE (row-level lock)
  //  2. Validate sufficient stock — abort if insufficient
  //  3. Insert the order record
  //  4. Insert order_items with SNAPSHOTTED prices (cost + selling)
  //  5. Decrement product_variants.stock_quantity for each item
  //  6. Insert stock_movements ledger entries (type: 'out')
  //  7. Commit — all or nothing

  async checkout(userId: number, input: CreateOrderInput): Promise<OrderWithItems> {
    const db = getDb();

    return db.transaction(async (trx: Knex.Transaction) => {
      // Step 1 & 2 — Lock variants and validate stock
      const resolvedItems: Array<{
        variant_id: number;
        quantity: number;
        unit_cost_price: number;
        unit_selling_price: number;
        line_total: number;
      }> = [];

      let total_amount = 0;

      for (const item of input.items) {
        const variant = await this.repo.findVariantForUpdate(item.variant_id, trx);

        if (!variant) {
          throw createApiError(404, `Variant ${item.variant_id} not found`);
        }

        if (variant.stock_quantity < item.quantity) {
          throw createApiError(
            422,
            `Insufficient stock for variant ${item.variant_id}. ` +
            `Available: ${variant.stock_quantity}, Requested: ${item.quantity}`,
          );
        }

        const line_total = Number(variant.selling_price) * item.quantity;
        total_amount += line_total;

        resolvedItems.push({
          variant_id: item.variant_id,
          quantity: item.quantity,
          // ← PRICE SNAPSHOT: copy current prices into order_items
          unit_cost_price: Number(variant.cost_price),
          unit_selling_price: Number(variant.selling_price),
          line_total,
        });
      }

      // Step 3 — Create the order with human-readable order_number and idempotency_key
      const orderDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `ORD-${orderDateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

      const orderId = await this.repo.createOrder(
        {
          user_id: userId,
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'unpaid',
          shipping_address: JSON.stringify(input.shipping_address) as any,
          notes: input.notes ?? null,
          total_amount,
          subtotal_amount: total_amount,
        },
        trx,
      );

      // Step 4 — Insert order items with snapshotted prices
      await this.repo.createOrderItems(
        resolvedItems.map((item) => ({ order_id: orderId, ...item })),
        trx,
      );

      // Step 5 & 6 — Deduct stock + log movements
      for (const item of resolvedItems) {
        await this.repo.updateVariantStock(item.variant_id, -item.quantity, trx);
        await this.repo.createStockMovement(
          {
            variant_id: item.variant_id,
            order_id: orderId,
            type: 'out',
            quantity: -item.quantity,
            note: `Order ${orderNumber} checkout`,
          },
          trx,
        );
      }

      // Transaction commits here — if any step throws, everything rolls back
      const order = await this.repo.findOrderById(orderId);
      return order!;
    });
  }

  // ── List & Get ─────────────────────────────────────────────────────────────

  async listOrders(query: OrderQueryInput): Promise<PaginatedResponse<OrderWithItems>> {
    const { rows, total } = await this.repo.findOrders(query);
    const { page, limit } = query;
    const total_pages = Math.ceil(total / limit);

    return {
      success: true,
      message: 'Orders retrieved',
      data: rows as unknown as OrderWithItems[],
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

  async getOrder(id: number, requestingUserId: number, isAdmin: boolean): Promise<OrderWithItems> {
    const order = await this.repo.findOrderById(id);
    if (!order) throw createApiError(404, `Order ${id} not found`);

    // Non-admin users can only view their own orders
    if (!isAdmin && order.user_id !== requestingUserId) {
      throw createApiError(403, 'Access denied');
    }

    return order;
  }

  async updateOrderStatus(id: number, input: UpdateOrderStatusInput): Promise<OrderWithItems> {
    const existing = await this.repo.findOrderById(id);
    if (!existing) throw createApiError(404, `Order ${id} not found`);

    await this.repo.updateOrderStatus(id, input);
    return (await this.repo.findOrderById(id))!;
  }

  async deleteOrder(id: number): Promise<void> {
    const existing = await this.repo.findOrderById(id);
    if (!existing) throw createApiError(404, `Order ${id} not found`);
    await this.repo.deleteOrder(id);
  }
}
