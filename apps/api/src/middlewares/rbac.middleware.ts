import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@ecommerce/shared-types';
import { createApiError } from './errorHandler.middleware.js';

// ── RBAC Middleware ────────────────────────────────────────────────────────────
// Role-Based Access Control.
// Usage: router.delete('/products/:id', jwtAuthMiddleware, rbac('admin'), ...)
//
// Multiple roles can be specified: rbac('admin', 'supplier')

export function rbac(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createApiError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        createApiError(
          403,
          `Access denied. Required roles: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
        ),
      );
    }

    next();
  };
}
