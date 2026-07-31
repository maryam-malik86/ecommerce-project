import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterSchema, LoginSchema } from './auth.schemas.js';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = RegisterSchema.parse(req.body);
      const result = await authService.register(input);
      res.status(201).json({ success: true, message: 'Registration successful', data: result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input);
      res.status(200).json({ success: true, message: 'Login successful', data: result });
    } catch (err) {
      next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.sub;
      const profile = await authService.getProfile(userId);
      res.status(200).json({ success: true, message: 'Profile retrieved', data: profile });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const search = req.query['search'] as string | undefined;
      const role = req.query['role'] as string | undefined;
      const tagId = req.query['tag_id'] ? Number(req.query['tag_id']) : undefined;
      const includeArchived = req.query['include_archived'] === 'true';

      const data = await authService.getUsers(search, role, tagId, includeArchived);
      res.json({ success: true, message: 'Users retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const adminUserId = req.user?.sub ?? null;
      const data = await authService.updateUser(id, req.body, adminUserId);
      res.json({ success: true, message: 'User updated', data });
    } catch (err) {
      next(err);
    }
  }

  async archiveUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const adminUserId = req.user?.sub ?? null;
      const result = await authService.archiveUser(id, adminUserId);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async sendPasswordResetEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const adminUserId = req.user?.sub ?? null;
      const result = await authService.sendPasswordResetEmail(id, adminUserId);
      res.json({ success: true, message: result.message, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = Number(req.params['id']);
      const data = await authService.getCustomerNotes(customerId);
      res.json({ success: true, message: 'Customer notes retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  async addCustomerNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = Number(req.params['id']);
      const authorAdminId = req.user?.sub ?? null;
      const note = req.body['note'];
      const data = await authService.addCustomerNote(customerId, authorAdminId, note);
      res.status(201).json({ success: true, message: 'Customer note added', data });
    } catch (err) {
      next(err);
    }
  }

  async getAllTags(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await authService.getAllTags();
      res.json({ success: true, message: 'Tags retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = Number(req.params['id']);
      const data = await authService.getCustomerTags(customerId);
      res.json({ success: true, message: 'Customer tags retrieved', data });
    } catch (err) {
      next(err);
    }
  }

  async addCustomerTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = Number(req.params['id']);
      const tagName = req.body['name'];
      const data = await authService.addCustomerTag(customerId, tagName);
      res.json({ success: true, message: 'Customer tag added', data });
    } catch (err) {
      next(err);
    }
  }

  async removeCustomerTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = Number(req.params['id']);
      const tagId = Number(req.params['tagId']);
      const data = await authService.removeCustomerTag(customerId, tagId);
      res.json({ success: true, message: 'Customer tag removed', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      await authService.deleteUser(id);
      res.json({ success: true, message: 'User deleted', data: null });
    } catch (err) {
      next(err);
    }
  }
}
