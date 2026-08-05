/**
 * apply_views.ts
 *
 * Applies catalog SQL views defined in views.sql to the database.
 * Run from the workspace root:
 *   pnpm --filter @ecommerce/database ts-node scripts/apply_views.ts
 * Or using npx ts-node from within packages/database:
 *   npx ts-node -r tsconfig-paths/register scripts/apply_views.ts
 */

import knexLib from 'knex';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../../../apps/api/.env') });
dotenv.config({ path: resolve(process.cwd(), 'apps/api/.env') });

const knex = knexLib({
  client: 'mysql2',
  connection: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? 3306),
    user: process.env['DB_USER'] ?? 'root',
    password: process.env['DB_PASSWORD'] ?? '',
    database: process.env['DB_NAME'] ?? 'ecommerce',
    timezone: '+00:00',
    charset: 'utf8mb4',
    multipleStatements: true,
  },
  pool: { min: 1, max: 2 },
});

async function main() {
  const sqlPath = resolve(__dirname, '../views.sql');
  const sql = readFileSync(sqlPath, 'utf8');

  // Split on semicolons and filter out blank / comment-only blocks
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`▶ Applying views.sql (${sql.length} bytes) in one shot…\n`);

  try {
    await knex.raw(sql);
    console.log('  ✓ All views applied successfully.');
  } catch (err: any) {
    console.error('  ✗ FAILED:', err.message);
    throw err;
  }

  console.log('\n✅ Done applying views.');
  await knex.destroy();
}

main().catch((err) => {
  console.error('❌ apply_views failed:', err);
  knex.destroy();
  process.exit(1);
});
