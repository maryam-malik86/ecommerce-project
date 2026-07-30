import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env from the api app's .env when running migrations standalone
dotenv.config({ path: resolve(__dirname, '../../apps/api/.env') });
dotenv.config({ path: resolve(process.cwd(), 'apps/api/.env') });

const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? 3306),
    user: process.env['DB_USER'] ?? 'root',
    password: process.env['DB_PASSWORD'] ?? '',
    database: process.env['DB_NAME'] ?? 'ecommerce',
    timezone: '+00:00',
    charset: 'utf8mb4',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: './seeds',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};

export default config;
