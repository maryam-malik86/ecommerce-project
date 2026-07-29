import knex from 'knex';
import type { Knex as KnexType } from 'knex';

// Singleton Knex instance — import this in any module that needs DB access
let _db: KnexType | null = null;

export function createDbClient(config: KnexType.Config): KnexType {
  if (_db) return _db;
  _db = knex(config);
  return _db;
}

export function getDb(): KnexType {
  if (!_db) {
    throw new Error('Database client not initialized. Call createDbClient() first.');
  }
  return _db;
}

export async function destroyDb(): Promise<void> {
  if (_db) {
    await _db.destroy();
    _db = null;
  }
}

export type { KnexType };
