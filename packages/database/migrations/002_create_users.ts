import type { Knex } from 'knex';

// Migration 002: Users table
// Supports three roles: admin, customer, supplier.
// Passwords are stored as bcrypt hashes — never plain text.

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.enum('role', ['admin', 'customer', 'supplier']).notNullable().defaultTo('customer');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['email'], 'idx_users_email');
    table.index(['role'], 'idx_users_role');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
}
