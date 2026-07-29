import { createDbClient, getDb } from '@ecommerce/database';
import { env } from './env.js';

// Initialize the Knex connection pool singleton.
// Called once during server startup in server.ts.
export function initDb() {
  return createDbClient({
    client: 'mysql2',
    connection: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      timezone: 'UTC',
      charset: 'utf8mb4',
    },
    pool: {
      min: 2,
      max: 10,
      // Destroy idle connections after 30 seconds
      idleTimeoutMillis: 30_000,
      // Fail fast if no connection available after 5 seconds
      acquireTimeoutMillis: 5_000,
    },
  });
}

// Re-export getDb for use in repository files
export { getDb };
