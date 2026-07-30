import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../../config/db.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';

export class CartController {
  // GET /cart — get or initialize cart session
  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDb();
      const sessionToken = (req.headers['x-cart-session'] as string) || `cart_sess_${Date.now()}`;
      let cart = await db('carts').where({ session_token: sessionToken, status: 'active' }).first();

      if (!cart) {
        const [id] = await db('carts').insert({
          session_token: sessionToken,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        });
        cart = await db('carts').where({ id }).first();
      }

      const items = await db('cart_items')
        .join('product_variants', 'cart_items.variant_id', 'product_variants.id')
        .join('products', 'product_variants.product_id', 'products.id')
        .select(
          'cart_items.*',
          'product_variants.sku',
          'product_variants.option_label',
          'product_variants.selling_price',
          'product_variants.stock_quantity',
          'products.name as product_name'
        )
        .where({ cart_id: cart.id });

      res.json({ success: true, message: 'Cart retrieved', data: { ...cart, items } });
    } catch (err) { next(err); }
  }

  // POST /cart/items — add item to cart & reserve stock for 15 mins
  async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDb();
      const { cart_id, variant_id, quantity } = req.body;
      const qty = Number(quantity || 1);

      const variant = await db('product_variants').where({ id: variant_id }).first();
      if (!variant) throw createApiError(404, `Variant ${variant_id} not found`);

      if (variant.stock_quantity < qty) {
        throw createApiError(422, `Only ${variant.stock_quantity} units available in stock`);
      }

      // Insert or update cart item
      const existingItem = await db('cart_items').where({ cart_id, variant_id }).first();
      if (existingItem) {
        await db('cart_items').where({ id: existingItem.id }).update({ quantity: existingItem.quantity + qty });
      } else {
        await db('cart_items').insert({ cart_id, variant_id, quantity: qty });
      }

      // Create 15-minute stock reservation
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await db('stock_reservations').insert({
        variant_id,
        cart_id,
        quantity: qty,
        status: 'active',
        expires_at: expiresAt,
        created_at: new Date(),
      });

      res.status(201).json({ success: true, message: 'Item added to cart and reserved for 15 mins' });
    } catch (err) { next(err); }
  }

  // DELETE /cart/items/:id — remove item from cart & release reservation
  async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDb();
      const id = Number(req.params['id']);
      const item = await db('cart_items').where({ id }).first();
      if (item) {
        await db('stock_reservations').where({ cart_id: item.cart_id, variant_id: item.variant_id, status: 'active' }).update({ status: 'released' });
        await db('cart_items').where({ id }).delete();
      }
      res.json({ success: true, message: 'Item removed from cart' });
    } catch (err) { next(err); }
  }
}
