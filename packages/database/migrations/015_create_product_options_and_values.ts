import type { Knex } from 'knex';

// Migration 015: Product Options + Option Values
//
// product_options — named axes of variation per product (e.g. "Color", "Size")
// option_values   — concrete values for each option (e.g. "Red", "XL")
//
// Uses hasTable guards so this migration is safe to run even if the tables
// were created by an earlier ad-hoc migration in a development database.

export async function up(knex: Knex): Promise<void> {
  const hasProductOptions = await knex.schema.hasTable('product_options');
  if (!hasProductOptions) {
    await knex.schema.createTable('product_options', (table) => {
      table.increments('id').primary();
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE');
      table.string('name', 100).notNullable(); // "Color", "Size", "Material" …
      table.timestamps(true, true);

      table.index(['product_id'], 'idx_product_options_product');
    });
  }

  const hasOptionValues = await knex.schema.hasTable('option_values');
  if (!hasOptionValues) {
    await knex.schema.createTable('option_values', (table) => {
      table.increments('id').primary();
      table
        .integer('option_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product_options')
        .onDelete('CASCADE');
      table.string('value', 100).notNullable(); // "Red", "XL" …
      table.timestamps(true, true);

      table.index(['option_id'], 'idx_option_values_option');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('option_values');
  await knex.schema.dropTableIfExists('product_options');
}
