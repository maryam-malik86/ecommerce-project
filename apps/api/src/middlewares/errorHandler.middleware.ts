import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// ── Custom API Error ───────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function createApiError(
  statusCode: number,
  message: string,
  errors?: Record<string, string[]>,
): ApiError {
  return new ApiError(statusCode, message, errors);
}

// ── 404 Handler ───────────────────────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must have 4 parameters to be recognised as an error handler by Express.

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path.join('.') || 'unknown';
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key]!.push(e.message);
    });

    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: fieldErrors,
    });
    return;
  }

  // Known ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Unknown / unexpected errors
  const message =
    err instanceof Error ? err.message : 'An unexpected error occurred';

  logger.error('Unhandled error', {
    error: message,
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.NODE_ENV === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};
