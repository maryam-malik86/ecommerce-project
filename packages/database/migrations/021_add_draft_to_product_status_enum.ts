import type { Knex } from 'knex';

// Migration 021: Add 'draft' to products.status ENUM column
//
// Allows products to be saved in 'draft' status before being published.

export async function up(knex: Knex): Promise<void> {
  const clientName = knex.client.config.client || '';
  const isMySQL = clientName.includes('mysql');

  if (isMySQL) {
    await knex.raw(
      "ALTER TABLE products MODIFY status ENUM('draft', 'active', 'inactive', 'archived') NOT NULL DEFAULT 'draft';"
    );
  } else {
    // For SQLite or Postgres
    await knex.schema.alterTable('products', (table) => {
      table.string('status', 50).notNullable().defaultTo('draft').alter();
    });
  }
}

export async function down(): Promise<void> {}
