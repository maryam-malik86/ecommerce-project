import type { Request, Response, NextFunction } from 'express';
import { OrdersService } from './orders.service.js';
import { CreateOrderSchema, UpdateOrderStatusSchema, OrderQuerySchema } from './orders.schemas.js';

const ordersService = new OrdersService();

export class OrdersController {
  // POST /orders/checkout  [customer]
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateOrderSchema.parse(req.body);
      const userId = req.user!.sub;
      const data = await ordersService.checkout(userId, input);
      res.status(201).json({ success: true, message: 'Order placed successfully', data });
    } catch (err) { next(err); }
  }

  // GET /orders  [admin: all orders | customer: own orders]
  async listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === 'admin';
      const query = OrderQuerySchema.parse({
        ...req.query,
        // Non-admins can only see their own orders
        ...(!isAdmin && { user_id: req.user!.sub }),
      });
      const result = await ordersService.listOrders(query);
      res.json(result);
    } catch (err) { next(err); }
  }

  // GET /orders/:id
  async getOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isAdmin = req.user!.role === 'admin';
      const data = await ordersService.getOrder(
        Number(req.params['id']),
        req.user!.sub,
        isAdmin,
      );
      res.json({ success: true, message: 'Order retrieved', data });
    } catch (err) { next(err); }
  }

  // PATCH /orders/:id/status  [admin]
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = UpdateOrderStatusSchema.parse(req.body);
      const data = await ordersService.updateOrderStatus(Number(req.params['id']), input);
      res.json({ success: true, message: 'Order status updated', data });
    } catch (err) { next(err); }
  }
}
