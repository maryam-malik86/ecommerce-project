import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/db.js';
import { createApiError } from './errorHandler.middleware.js';

// ── API Key Middleware ─────────────────────────────────────────────────────────
// Layer 1 of dual-layer security.
// Validates the x-api-key header against the api_clients table.
// Also attaches allowed origins to the request for dynamic CORS handling.

declare global {
  namespace Express {
    interface Request {
      apiClient?: {
        id: number;
        name: string;
        allowed_origins: string[];
      };
    }
  }
}

export async function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return next(createApiError(401, 'Missing x-api-key header'));
  }

  const db = getDb();
  const client = await db('api_clients')
    .where({ api_key: apiKey, is_active: true })
    .first();

  if (!client) {
    return next(createApiError(401, 'Invalid or inactive API key'));
  }

  // Parse allowed_origins JSON column and attach to request
  const allowedOrigins: string[] = typeof client.allowed_origins === 'string'
    ? (JSON.parse(client.allowed_origins) as string[])
    : (client.allowed_origins as string[]);

  req.apiClient = {
    id: client.id as number,
    name: client.name as string,
    allowed_origins: allowedOrigins,
  };

  next();
}
