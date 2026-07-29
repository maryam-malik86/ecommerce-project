import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { apiKeyMiddleware } from './middlewares/apiKey.middleware.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.middleware.js';

// ── Route Modules ──────────────────────────────────────────────────────────────
import authRoutes from './modules/auth/auth.routes.js';
import catalogRoutes from './modules/catalog/catalog.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';
import marketingRoutes from './modules/marketing/marketing.routes.js';

const app: Express = express();

// ── Security Headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ───────────────────────────────────────────────────────────────────────
// Dynamic CORS: allowed origins are determined per-request by the API client's
// allowed_origins list. Falls back to a permissive dev config when no API key
// is present (useful for local testing).
app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow all origins for easier local testing
      if (env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      // In production, allow requests with no origin (server-to-server)
      if (!origin) return callback(null, true);
      // Dynamic per-client origin check happens after API key validation
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  }),
);

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logging ───────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: () => env.NODE_ENV === 'test',
  }),
);

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// ── Health Check (no auth required) ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy', data: { timestamp: new Date().toISOString() } });
});

// ── API Key Verification ───────────────────────────────────────────────────────
// All /api/v1 routes require a valid x-api-key header
app.use('/api/v1', apiKeyMiddleware);

// ── Feature Routes ────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/catalog', catalogRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/marketing', marketingRoutes);

// ── 404 + Global Error Handler ─────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
