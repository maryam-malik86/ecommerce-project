import type { Knex } from 'knex';

// Migration 001: API Clients table
// Stores registered API consumers (storefront, admin, mobile apps).
// The api_key is checked via the x-api-key header on every request.
// allowed_origins is a JSON array of allowed CORS origins for that client.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('api_clients', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().comment('Friendly name, e.g. "Storefront", "Admin"');
    table.string('api_key', 64).notNullable().unique().comment('SHA-256 hex key sent in x-api-key header');
    table.json('allowed_origins').notNullable().comment('Array of allowed CORS origin strings');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('api_clients');
}
