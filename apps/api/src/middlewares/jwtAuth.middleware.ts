import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthTokenPayload, UserRole } from '@ecommerce/shared-types';
import { env } from '../config/env.js';
import { createApiError } from './errorHandler.middleware.js';

// ── JWT Auth Middleware ────────────────────────────────────────────────────────
// Layer 2 of dual-layer security.
// Validates the Authorization: Bearer <JWT> header.
// Attaches the decoded payload (sub, email, role) to req.user.

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createApiError(401, 'Missing or malformed Authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as unknown as AuthTokenPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(createApiError(401, 'Token expired'));
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return next(createApiError(401, 'Invalid token'));
    }
    next(err);
  }
}

// Utility: sign a new JWT for the given user
export function signJwt(payload: Omit<AuthTokenPayload, 'iat' | 'exp'>): string {
  // Parse duration to seconds: '7d' → 604800
  const parseDuration = (d: string): number => {
    const match = d.match(/^(\d+)([smhd])$/);
    if (!match) return 604800;
    const n = parseInt(match[1]!, 10);
    const unit = match[2];
    if (unit === 's') return n;
    if (unit === 'm') return n * 60;
    if (unit === 'h') return n * 3600;
    if (unit === 'd') return n * 86400;
    return 604800;
  };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: parseDuration(env.JWT_EXPIRES_IN),
  });
}
