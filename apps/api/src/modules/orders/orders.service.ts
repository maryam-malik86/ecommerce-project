import type { Knex } from 'knex';
import { getDb } from '../../config/db.js';
import { OrdersRepository } from './orders.repository.js';
import { emailTemplatesService } from '../email-templates/email-templates.service.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';
import type { CreateOrderInput, UpdateOrderStatusInput, OrderQueryInput } from './orders.schemas.js';
import type { PaginatedResponse, OrderWithItems } from '@ecommerce/shared-types';

export class OrdersService {
  private repo = new OrdersRepository();

  async checkout(userId: number, input: CreateOrderInput): Promise<OrderWithItems> {
    const db = getDb();

    const createdOrder = await db.transaction(async (trx: Knex.Transaction) => {
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
          unit_cost_price: Number(variant.cost_price),
          unit_selling_price: Number(variant.selling_price),
          line_total,
        });
      }

      // Step 3 — Create the order
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

      // Step 4 — Insert order items
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

      const order = await this.repo.findOrderById(orderId, trx);
      return order!;
    });

    // Auto-trigger Order Confirmation & Itemized Invoice Email
    emailTemplatesService.triggerOrderConfirmationInvoice({
      id: createdOrder.id,
      order_number: createdOrder.order_number || undefined,
      customer_name: (createdOrder as any).user_name || 'Customer',
      customer_email: (createdOrder as any).user_email || 'customer@example.com',
      total_amount: Number(createdOrder.total_amount),
      shipping_address: typeof createdOrder.shipping_address === 'string' ? createdOrder.shipping_address : JSON.stringify(createdOrder.shipping_address),
      items: (createdOrder.items || []).map((i: any) => ({
        title: i.product_name || i.variant_sku || 'Product Item',
        quantity: i.quantity,
        unit_price: Number(i.unit_selling_price || 0),
      })),
    }).catch(() => {});

    return createdOrder;
  }

  async guestCheckout(input: any): Promise<OrderWithItems> {
    const db = getDb();

    let userId: number;
    const existingUser = await db('users').where({ email: input.customer_email }).first();
    if (existingUser) {
      userId = existingUser.id;
    } else {
      const [newUserId] = await db('users').insert({
        email: input.customer_email,
        name: input.customer_name,
        role: 'customer',
        password_hash: 'GUEST_USER',
        created_at: new Date(),
        updated_at: new Date(),
      });
      userId = newUserId!;
    }

    const createdOrder = await db.transaction(async (trx: Knex.Transaction) => {
      const resolvedItems: Array<{
        variant_id: number;
        quantity: number;
        unit_cost_price: number;
        unit_selling_price: number;
        line_total: number;
      }> = [];

      let total_amount = 0;

      for (const item of input.items) {
        let variant: any = null;
        if (item.variant_id) {
          variant = await this.repo.findVariantForUpdate(item.variant_id, trx).catch(() => null);
        }
        if (!variant && item.product_id) {
          variant = await trx('product_variants').where({ product_id: item.product_id }).first();
        }
        if (!variant && item.sku) {
          variant = await trx('product_variants').where({ sku: item.sku }).first();
        }
        if (!variant) {
          variant = await trx('product_variants').first();
        }

        const unit_selling_price = item.unit_price ? Number(item.unit_price) : (variant ? Number(variant.selling_price) : 50);
        const unit_cost_price = variant ? Number(variant.cost_price) : Math.round(unit_selling_price * 0.4);
        const variant_id = variant ? variant.id : 1;
        const line_total = unit_selling_price * item.quantity;
        total_amount += line_total;

        resolvedItems.push({
          variant_id,
          quantity: item.quantity,
          unit_cost_price,
          unit_selling_price,
          line_total,
        });
      }

      const orderDateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `ORD-${orderDateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

      const shippingAddr = typeof input.shipping_address === 'string'
        ? input.shipping_address
        : JSON.stringify(input.shipping_address);

      const orderId = await this.repo.createOrder(
        {
          user_id: userId,
          order_number: orderNumber,
          status: 'pending',
          payment_status: input.payment_method === 'paid' ? 'paid' : 'unpaid',
          shipping_address: shippingAddr,
          notes: input.notes ?? null,
          total_amount,
          subtotal_amount: total_amount,
        },
        trx,
      );

      await this.repo.createOrderItems(
        resolvedItems.map((item) => ({ order_id: orderId, ...item })),
        trx,
      );

      for (const item of resolvedItems) {
        await this.repo.updateVariantStock(item.variant_id, -item.quantity, trx).catch(() => {});
      }

      const order = await this.repo.findOrderById(orderId, trx);
      return order!;
    });

    emailTemplatesService.triggerOrderConfirmationInvoice({
      id: createdOrder.id,
      order_number: createdOrder.order_number || undefined,
      customer_name: input.customer_name || 'Customer',
      customer_email: input.customer_email,
      total_amount: Number(createdOrder.total_amount),
      shipping_address: typeof createdOrder.shipping_address === 'string' ? createdOrder.shipping_address : JSON.stringify(createdOrder.shipping_address),
      items: (createdOrder.items || []).map((i: any) => ({
        title: i.product_name || i.variant_sku || 'Surgical Instrument',
        quantity: i.quantity,
        unit_price: Number(i.unit_selling_price || 0),
      })),
    }).catch(() => {});

    return createdOrder;
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

    if (!isAdmin && order.user_id !== requestingUserId) {
      throw createApiError(403, 'Access denied');
    }

    return order;
  }

  async updateOrderStatus(id: number, input: UpdateOrderStatusInput): Promise<OrderWithItems> {
    const existing = await this.repo.findOrderById(id);
    if (!existing) throw createApiError(404, `Order ${id} not found`);

    await this.repo.updateOrderStatus(id, input);
    const updated = (await this.repo.findOrderById(id))!;

    if (input.status === 'shipped') {
      emailTemplatesService.triggerOrderStatusShipped({
        id: updated.id,
        customer_name: (updated as any).user_name || 'Customer',
        customer_email: (updated as any).user_email || 'customer@example.com',
        carrier: (updated as any).carrier || 'Standard Shipping',
        tracking_number: (updated as any).tracking_number || 'N/A',
        shipping_address: typeof updated.shipping_address === 'string' ? updated.shipping_address : JSON.stringify(updated.shipping_address),
      }).catch(() => {});
    }

    return updated;
  }


  async bulkUpdateOrderStatus(ids: number[], status: string, payment_status?: string): Promise<void> {
    await this.repo.bulkUpdateOrderStatus(ids, { status, payment_status });
  }

  async bulkDeleteOrders(ids: number[]): Promise<void> {
    await this.repo.bulkDeleteOrders(ids);
  }

  async deleteOrder(id: number): Promise<void> {
    const existing = await this.repo.findOrderById(id);
    if (!existing) throw createApiError(404, `Order ${id} not found`);
    await this.repo.deleteOrder(id);
  }
}

