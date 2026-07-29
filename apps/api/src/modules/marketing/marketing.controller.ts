import type { Request, Response, NextFunction } from 'express';
import { MarketingService } from './marketing.service.js';
import { SubscribeSchema, BroadcastSchema } from './marketing.schemas.js';

const marketingService = new MarketingService();

export class MarketingController {
  async subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = SubscribeSchema.parse(req.body);
      const data = await marketingService.subscribe(input);
      res.status(201).json({ success: true, message: data.message, data: null });
    } catch (err) { next(err); }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      const data = await marketingService.unsubscribe(email);
      res.json({ success: true, message: data.message, data: null });
    } catch (err) { next(err); }
  }

  async getSubscribers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await marketingService.getAllSubscribers();
      res.json({ success: true, message: 'Subscribers retrieved', data });
    } catch (err) { next(err); }
  }

  async broadcast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = BroadcastSchema.parse(req.body);
      const data = await marketingService.broadcast(input);
      res.json({ success: true, message: data.message, data: { sent: data.sent } });
    } catch (err) { next(err); }
  }
}
