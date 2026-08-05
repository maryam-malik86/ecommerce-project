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

function sanitizeErrorMessage(rawMsg: string): string {
  if (!rawMsg) return 'An unexpected error occurred';

  if (rawMsg.includes('ER_DATA_TOO_LONG') || rawMsg.includes('Data too long')) {
    return 'The image or field data is too large for the database column.';
  }

  if (rawMsg.includes('ER_DUP_ENTRY') || rawMsg.includes('Duplicate entry')) {
    const match = rawMsg.match(/Duplicate entry '(.*?)'/);
    return match ? `Duplicate entry for '${match[1]}'` : 'An item with this unique key already exists.';
  }

  // Strip out raw SQL queries and base64 strings
  if (rawMsg.toLowerCase().startsWith('update ') || rawMsg.toLowerCase().startsWith('insert ') || rawMsg.toLowerCase().startsWith('select ')) {
    const sqlErrorSplit = rawMsg.split(/ - (ER_[A-Z_]+|SQLITE_[A-Z_]+):/);
    const lastPart = sqlErrorSplit[sqlErrorSplit.length - 1];
    if (lastPart) {
      return `Database Error: ${lastPart.trim()}`;
    }
    return 'Database update error. Please check image size and field lengths.';
  }

  if (rawMsg.length > 250) {
    return rawMsg.slice(0, 250) + '...';
  }

  return rawMsg;
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
      (fieldErrors[key] as string[]).push(e.message);
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
  const rawMessage =
    err instanceof Error ? err.message : 'An unexpected error occurred';
  const cleanMessage = sanitizeErrorMessage(rawMessage);

  logger.error('Unhandled error', {
    error: rawMessage,
    stack: err instanceof Error ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: cleanMessage,
    ...(env.NODE_ENV === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};
