import type { Knex } from 'knex';

// Migration 008: Newsletter Subscribers
// Tracks email subscriptions for marketing broadcasts.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('newsletter_subscribers', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('name', 150).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('subscribed_at').notNullable().defaultTo(knex.fn.now());

    table.index(['email'], 'idx_newsletter_email');
    table.index(['is_active'], 'idx_newsletter_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('newsletter_subscribers');
}
