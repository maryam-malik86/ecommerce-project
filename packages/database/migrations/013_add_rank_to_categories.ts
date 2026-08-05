import type { Knex } from 'knex';

// Migration 013: Add `rank` to categories
//
// `parent_id` self-FK and its index were already created in migration 003.
// This migration adds only the missing `rank` column used for ordering
// siblings within the same level of the category tree.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('categories', (table) => {
    table.integer('rank').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('categories', (table) => {
    table.dropColumn('rank');
  });
}
