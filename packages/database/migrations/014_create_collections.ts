import type { Knex } from 'knex';

// Migration 014: Collections + product_collections join
//
// collections     — flat marketing groupings (e.g. "Eco Travel Collection", "Summer Sale")
// product_collections — many-to-many between products and collections
//
// Collections are deliberately NOT hierarchical; that is the category tree's job.
// A product can belong to any number of collections regardless of its category.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('collections', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('slug', 200).notNullable().unique();
    table.text('description').nullable();
    table.timestamps(true, true);

    table.index(['slug'], 'idx_collections_slug');
  });

  await knex.schema.createTable('product_collections', (table) => {
    table
      .integer('product_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('products')
      .onDelete('CASCADE');
    table
      .integer('collection_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('collections')
      .onDelete('CASCADE');
    table.primary(['product_id', 'collection_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('product_collections');
  await knex.schema.dropTableIfExists('collections');
}
