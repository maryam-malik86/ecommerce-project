import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Create roles table
  if (!(await knex.schema.hasTable('roles'))) {
    await knex.schema.createTable('roles', (table) => {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.string('slug', 100).notNullable().unique();
      table.text('description').nullable();
      table.boolean('is_system').notNullable().defaultTo(false);
      table.string('badge_color', 30).notNullable().defaultTo('indigo');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // 2. Create permissions table or ensure category column exists
  if (!(await knex.schema.hasTable('permissions'))) {
    await knex.schema.createTable('permissions', (table) => {
      table.increments('id').primary();
      table.string('code', 100).notNullable().unique();
      table.string('label', 150).notNullable();
      table.text('description').nullable();
      table.string('category', 50).notNullable().defaultTo('General');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

      table.index(['category'], 'idx_permissions_category');
    });
  } else {
    const hasCategory = await knex.schema.hasColumn('permissions', 'category');
    if (!hasCategory) {
      await knex.schema.alterTable('permissions', (table) => {
        table.string('category', 50).notNullable().defaultTo('General');
        table.index(['category'], 'idx_permissions_category');
      });
    }
  }

  // 3. Create role_permissions junction table
  if (!(await knex.schema.hasTable('role_permissions'))) {
    await knex.schema.createTable('role_permissions', (table) => {
      table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
      table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
      table.primary(['role_id', 'permission_id']);
    });
  }

  // 4. Add nullable role_id column to users table if missing
  const hasRoleId = await knex.schema.hasColumn('users', 'role_id');
  if (!hasRoleId) {
    await knex.schema.alterTable('users', (table) => {
      table.integer('role_id').unsigned().nullable().references('id').inTable('roles').onDelete('SET NULL');
    });
  }

  // 5. Alter users.role column from restricted ENUM to VARCHAR(100) for dynamic roles support
  try {
    await knex.raw('ALTER TABLE users MODIFY COLUMN role VARCHAR(100) NOT NULL DEFAULT "customer"');
  } catch (err) {
    console.warn('Could not alter users.role column via raw SQL:', err);
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasRoleId = await knex.schema.hasColumn('users', 'role_id');
  if (hasRoleId) {
    await knex.schema.alterTable('users', (table) => {
      table.dropForeign(['role_id']);
      table.dropColumn('role_id');
    });
  }

  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
}
