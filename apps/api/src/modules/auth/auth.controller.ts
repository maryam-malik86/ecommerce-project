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
      const data = await authService.getUsers(search, role);
      res.json({ success: true, message: 'Users retrieved', data });
    } catch (err) { next(err); }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      const data = await authService.updateUser(id, req.body);
      res.json({ success: true, message: 'User updated', data });
    } catch (err) { next(err); }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params['id']);
      await authService.deleteUser(id);
      res.json({ success: true, message: 'User deleted', data: null });
    } catch (err) { next(err); }
  }
}
