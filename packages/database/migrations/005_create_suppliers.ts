import type { Knex } from 'knex';

// Migration 005: Suppliers table
// Tracks who supplies stock. Referenced in stock_movements for traceability.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('suppliers', (table) => {
    table.increments('id').primary();
    table.string('name', 200).notNullable();
    table.string('contact_email', 255).nullable();
    table.string('contact_phone', 50).nullable();
    table.text('address').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['name'], 'idx_suppliers_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('suppliers');
}
