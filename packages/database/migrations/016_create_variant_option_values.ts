import type { Knex } from 'knex';

// Migration 016: variant_option_values join table
//
// Links each product_variant to the exact set of option_values it represents.
// Uses hasTable guard for idempotency.

export async function up(knex: Knex): Promise<void> {
  const hasTable = await knex.schema.hasTable('variant_option_values');
  if (!hasTable) {
    await knex.schema.createTable('variant_option_values', (table) => {
      table
        .integer('variant_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('product_variants')
        .onDelete('CASCADE');
      table
        .integer('option_value_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('option_values')
        .onDelete('CASCADE');
      table.primary(['variant_id', 'option_value_id']);

      table.index(['variant_id'], 'idx_vov_variant');
      table.index(['option_value_id'], 'idx_vov_value');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('variant_option_values');
}
