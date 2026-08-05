import type { Knex } from 'knex';

// Migration 019: Convert image_url on products and product_variants to LONGTEXT
//
// Allows storing base64 Data URLs or long image URLs without truncation or ER_DATA_TOO_LONG error.

export async function up(knex: Knex): Promise<void> {
  const clientName = knex.client.config.client || '';
  const isMySQL = clientName.includes('mysql');

  if (isMySQL) {
    await knex.raw('ALTER TABLE products MODIFY image_url LONGTEXT NULL;');
    await knex.raw('ALTER TABLE product_variants MODIFY image_url LONGTEXT NULL;');
  } else {
    await knex.schema.alterTable('products', (table) => {
      table.text('image_url').alter();
    });
    await knex.schema.alterTable('product_variants', (table) => {
      table.text('image_url').alter();
    });
  }
}

export async function down(): Promise<void> {}
