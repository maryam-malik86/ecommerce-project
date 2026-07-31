import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Add archived_at TIMESTAMP column to users table if missing
  const hasArchivedAt = await knex.schema.hasColumn('users', 'archived_at');
  if (!hasArchivedAt) {
    await knex.schema.alterTable('users', (table) => {
      table.timestamp('archived_at').nullable().defaultTo(null);
    });
  }

  // 2. Create audit_logs table
  if (!(await knex.schema.hasTable('audit_logs'))) {
    await knex.schema.createTable('audit_logs', (table) => {
      table.bigIncrements('id').primary();
      table.integer('admin_user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.integer('target_user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('action', 50).notNullable();
      table.text('old_value').nullable();
      table.text('new_value').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      table.index(['target_user_id'], 'idx_audit_target');
      table.index(['admin_user_id'], 'idx_audit_admin');
    });
  }

  // 3. Create customer_notes table
  if (!(await knex.schema.hasTable('customer_notes'))) {
    await knex.schema.createTable('customer_notes', (table) => {
      table.bigIncrements('id').primary();
      table.integer('customer_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('author_admin_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.text('note').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

      table.index(['customer_id'], 'idx_notes_customer');
    });
  }

  // 4. Create tags table
  if (!(await knex.schema.hasTable('tags'))) {
    await knex.schema.createTable('tags', (table) => {
      table.increments('id').primary();
      table.string('name', 50).notNullable().unique();
    });
  }

  // 5. Create customer_tags junction table
  if (!(await knex.schema.hasTable('customer_tags'))) {
    await knex.schema.createTable('customer_tags', (table) => {
      table.integer('customer_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('tag_id').unsigned().notNullable().references('id').inTable('tags').onDelete('CASCADE');
      table.primary(['customer_id', 'tag_id']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('customer_tags');
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('customer_notes');
  await knex.schema.dropTableIfExists('audit_logs');

  const hasArchivedAt = await knex.schema.hasColumn('users', 'archived_at');
  if (hasArchivedAt) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('archived_at');
    });
  }
}
