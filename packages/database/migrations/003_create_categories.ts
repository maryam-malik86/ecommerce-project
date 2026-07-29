import type { Knex } from 'knex';

// Migration 003: Categories table
// Supports self-referential hierarchy (parent_id for sub-categories).

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('slug', 200).notNullable().unique();
    table.text('description').nullable();
    table.integer('parent_id').unsigned().nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table
      .foreign('parent_id')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');

    table.index(['slug'], 'idx_categories_slug');
    table.index(['parent_id'], 'idx_categories_parent');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('categories');
}
