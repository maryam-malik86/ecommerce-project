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
}
