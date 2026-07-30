import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../../config/db.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';

export class DiscountsController {
  // POST /discounts/validate  (Storefront promo code check)
  async validateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, cart_subtotal } = req.body;
      if (!code) throw createApiError(400, 'Discount code is required');

      const db = getDb();
      const discount = await db('discounts')
        .where('code', String(code).trim().toUpperCase())
        .andWhere('is_active', true)
        .first();

      if (!discount) {
        throw createApiError(404, 'Invalid or expired discount code');
      }

      const subtotal = Number(cart_subtotal ?? 0);
      if (discount.min_order_amount && subtotal < Number(discount.min_order_amount)) {
        throw createApiError(422, `Minimum order subtotal of $${discount.min_order_amount} required for this code`);
      }

      let discountAmount = 0;
      if (discount.type === 'percentage') {
        discountAmount = (subtotal * Number(discount.value)) / 100;
      } else {
        discountAmount = Number(discount.value);
      }

      res.json({
        success: true,
        message: 'Discount code applied',
        data: {
          id: discount.id,
          code: discount.code,
          type: discount.type,
          value: discount.value,
          discount_amount: Math.min(discountAmount, subtotal),
        },
      });
    } catch (err) { next(err); }
  }

  // GET /discounts  (Admin list)
  async listDiscounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDb();
      const data = await db('discounts').orderBy('created_at', 'desc');
      res.json({ success: true, message: 'Discounts retrieved', data });
    } catch (err) { next(err); }
  }

  // POST /discounts  (Admin create)
  async createDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDb();
      const { code, type, value, min_order_amount } = req.body;
      const uppercaseCode = String(code).toUpperCase().trim();
      const [id] = await db('discounts').insert({
        code: uppercaseCode,
        type,
        value: Number(value),
        min_order_amount: Number(min_order_amount ?? 0),
        is_active: true,
        created_at: new Date(),
      });

      const data = await db('discounts').where({ id }).first();
      res.status(201).json({ success: true, message: 'Discount code created', data });
    } catch (err) { next(err); }
  }

  // DELETE /discounts/:id  (Admin delete)
  async deleteDiscount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = getDb();
      await db('discounts').where({ id: Number(req.params['id']) }).delete();
      res.json({ success: true, message: 'Discount deleted', data: null });
    } catch (err) { next(err); }
  }
}
