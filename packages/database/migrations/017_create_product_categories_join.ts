import type { Knex } from 'knex';

// Migration 017: product_categories join table
//
// Replaces the single products.category_id FK with a proper many-to-many table.
// is_primary flags the canonical category for breadcrumbs and listing views.
//
// Backfill: existing products with a non-null category_id are inserted as
// primary rows so no data is lost before migration 018 drops the old column.
// Uses hasTable guard for idempotency.

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('product_categories');
  if (!hasTable) {
    await knex.schema.createTable('product_categories', (table) => {
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE');
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE');
      table.boolean('is_primary').notNullable().defaultTo(false);
      table.primary(['product_id', 'category_id']);

      table.index(['product_id'], 'idx_pc_product');
      table.index(['category_id'], 'idx_pc_category');
    });

    // Backfill from existing single category_id column
    await knex.raw(`
      INSERT INTO product_categories (product_id, category_id, is_primary)
      SELECT id, category_id, true
      FROM products
      WHERE category_id IS NOT NULL
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_categories');
}
