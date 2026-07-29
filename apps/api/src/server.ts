import { env } from './config/env.js';
import { initDb, getDb } from './config/db.js';
import { logger } from './utils/logger.js';
import app from './app.js';

async function main() {
  // 1. Initialize MySQL connection pool
  initDb();

  // 2. Verify DB connectivity before accepting traffic
  try {
    await getDb().raw('SELECT 1');
    logger.info('✅  Database connection pool established');
  } catch (err) {
    logger.error('❌  Failed to connect to MySQL database', { error: err });
    process.exit(1);
  }

  // 3. Start HTTP server
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀  API server running on http://localhost:${env.PORT}`);
    logger.info(`📋  Environment: ${env.NODE_ENV}`);
    logger.info(`📖  Health check: http://localhost:${env.PORT}/health`);
  });

  // 4. Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      try {
        await getDb().destroy();
        logger.info('Database connections closed');
      } catch (err) {
        logger.error('Error closing database connections', { error: err });
      }
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 5. Catch unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
