import type { Knex } from 'knex';

// Migration 004: Products and Product Variants
//
// products       — the "parent" catalog entry (name, description, category)
// product_variants — the actual sellable SKUs with pricing and stock.
//
// cost_price and selling_price live on the variant, not the order_items.
// order_items snapshots them at checkout for historical accuracy.

export async function up(knex: Knex): Promise<void> {
  // ── Products ──────────────────────────────────────────────────────────────
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table
      .integer('category_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('categories')
      .onDelete('RESTRICT');
    table.string('name', 255).notNullable();
    table.string('slug', 300).notNullable().unique();
    table.text('description').nullable();
    table
      .enum('status', ['active', 'inactive', 'archived'])
      .notNullable()
      .defaultTo('active');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['slug'], 'idx_products_slug');
    table.index(['category_id'], 'idx_products_category');
    table.index(['status'], 'idx_products_status');
  });

  // ── Product Variants (SKUs) ───────────────────────────────────────────────
  await knex.schema.createTable('product_variants', (table) => {
    table.increments('id').primary();
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    table.string('sku', 100).notNullable().unique();
    table.string('option_label', 255).notNullable().comment('e.g. "Red / XL"');
    table.decimal('cost_price', 10, 2).notNullable().comment('Supplier cost; used for profit calc');
    table.decimal('selling_price', 10, 2).notNullable().comment('Customer-facing price');
    table.integer('stock_quantity').unsigned().notNullable().defaultTo(0);
    table.integer('low_stock_threshold').unsigned().notNullable().defaultTo(5);
    table.string('image_url', 500).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['product_id'], 'idx_variants_product');
    table.index(['sku'], 'idx_variants_sku');
    table.index(['stock_quantity'], 'idx_variants_stock');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_variants');
  await knex.schema.dropTableIfExists('products');
}
