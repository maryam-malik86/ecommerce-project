import type { Request, Response, NextFunction } from 'express';
import { OrderInquiriesService } from './order-inquiries.service.js';
import {
  CreateInquirySchema,
  ReplyInquirySchema,
  UpdateInquiryStatusSchema,
  InquiryQuerySchema,
} from './order-inquiries.schemas.js';

const service = new OrderInquiriesService();

export class OrderInquiriesController {
  // POST /order-inquiries — Public / Customer submission
  async createInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = CreateInquirySchema.parse(req.body);
      const userId = req.user?.sub || null;
      const data = await service.createInquiry(input, userId);
      res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data });
    } catch (err) {
      next(err);
    }
  }

  // GET /order-inquiries — Admin list or customer own
  async listInquiries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = InquiryQuerySchema.parse(req.query);
      const result = await service.listInquiries(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  // GET /order-inquiries/:id
  async getInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await service.getInquiry(Number(req.params['id']));
      res.json({ success: true, message: 'Inquiry retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /order-inquiries/:id/status — Admin update status/priority
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = UpdateInquiryStatusSchema.parse(req.body);
      const data = await service.updateStatus(Number(req.params['id']), input);
      res.json({ success: true, message: 'Inquiry status updated', data });
    } catch (err) {
      next(err);
    }
  }

  // POST /order-inquiries/:id/replies — Reply to inquiry thread
  async addReply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ReplyInquirySchema.parse(req.body);
      const senderId = req.user?.sub || null;
      const senderName = (req.user as any)?.name || req.user?.email || (req.user?.role === 'admin' ? 'Support Agent' : 'Customer');
      const data = await service.addReply(Number(req.params['id']), input, senderId, senderName);

      res.json({ success: true, message: 'Reply posted', data });
    } catch (err) {
      next(err);
    }
  }

  // DELETE /order-inquiries/:id — Admin delete inquiry
  async deleteInquiry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await service.deleteInquiry(Number(req.params['id']));
      res.json({ success: true, message: 'Inquiry deleted', data: null });
    } catch (err) {
      next(err);
    }
  }
}
