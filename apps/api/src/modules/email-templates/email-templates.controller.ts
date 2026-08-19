import type { Request, Response, NextFunction } from 'express';
import { emailTemplatesService } from './email-templates.service.js';
import { UpdateEmailTemplateSchema, TestSendEmailSchema } from './email-templates.schemas.js';

export class EmailTemplatesController {
  async getAllTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await emailTemplatesService.getAllTemplates();
      res.json({ success: true, message: 'Email templates retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  async getTemplateByKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = String(req.params['key']);
      const data = await emailTemplatesService.getTemplateByKey(key);
      res.json({ success: true, message: 'Email template retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  async updateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = String(req.params['key']);
      const input = UpdateEmailTemplateSchema.parse(req.body);
      const data = await emailTemplatesService.updateTemplate(key, input);
      res.json({ success: true, message: 'Email template updated', data });
    } catch (err) {
      next(err);
    }
  }

  async sendTestEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const key = String(req.params['key']);
      const input = TestSendEmailSchema.parse(req.body);
      const data = await emailTemplatesService.sendTestEmail(key, input.to);
      res.json({ success: true, message: `Test email sent to ${input.to}`, data });
    } catch (err) {
      next(err);
    }
  }
}


export const emailTemplatesController = new EmailTemplatesController();
