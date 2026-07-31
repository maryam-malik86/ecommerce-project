import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@ecommerce/shared-types';
import { createApiError } from './errorHandler.middleware.js';
import { getDb } from '../config/db.js';

// ── Role Check Middleware ──────────────────────────────────────────────────

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

// ── Permission Check Middleware ────────────────────────────────────────────

export function requirePermission(...requiredCodes: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(createApiError(401, 'Authentication required'));
      }

      const userRoleStr = req.user.role as string;
      // Root admin / super_admin bypasses permission checks
      if (userRoleStr === 'admin' || userRoleStr === 'super_admin') {
        return next();
      }

      const db = getDb();
      const user = await db('users').where({ id: req.user.sub }).select('role_id', 'role').first();
      if (!user) {
        return next(createApiError(401, 'User account not found'));
      }

      let roleId = user.role_id;
      if (!roleId && user.role) {
        const matchedRole = await db('roles').where({ slug: user.role }).first();
        if (matchedRole) roleId = matchedRole.id;
      }

      if (!roleId) {
        return next(createApiError(403, `Access denied. No system role assigned.`));
      }

      const grantedPerms = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where('role_permissions.role_id', roleId)
        .select('permissions.code');

      const permSet = new Set(grantedPerms.map((p: any) => p.code));
      const hasPermission = requiredCodes.some((code) => permSet.has(code));

      if (!hasPermission) {
        return next(
          createApiError(
            403,
            `Access denied. Required permission: [${requiredCodes.join(', ')}]`,
          ),
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
