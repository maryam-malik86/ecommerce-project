import type { Knex } from 'knex';

// Migration 022: Order Inquiries and Inquiry Reply Threads
//
// Allows customers and guests to submit order support inquiries/tickets
// (shipping questions, cancellations, refunds, etc.) and allows admins
// to manage thread replies and resolution statuses.

export async function up(knex: Knex): Promise<void> {
  // ── 1. order_inquiries table ──────────────────────────────────────────────
  await knex.schema.createTable('order_inquiries', (table) => {
    table.increments('id').primary();
    table.string('inquiry_number', 50).notNullable().unique();
    table
      .integer('order_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('orders')
      .onDelete('SET NULL');
    table
      .integer('user_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('customer_name', 255).notNullable();
    table.string('customer_email', 255).notNullable();
    table.string('subject', 255).notNullable();
    table
      .enum('category', [
        'shipping',
        'cancellation',
        'return_refund',
        'product_question',
        'billing',
        'other',
      ])
      .notNullable()
      .defaultTo('other');
    table
      .enum('priority', ['low', 'medium', 'high', 'urgent'])
      .notNullable()
      .defaultTo('medium');
    table
      .enum('status', ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'])
      .notNullable()
      .defaultTo('open');
    table.text('message').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['inquiry_number'], 'idx_inquiry_number');
    table.index(['order_id'], 'idx_inquiry_order');
    table.index(['customer_email'], 'idx_inquiry_email');
    table.index(['status'], 'idx_inquiry_status');
    table.index(['priority'], 'idx_inquiry_priority');
    table.index(['category'], 'idx_inquiry_category');
  });

  // ── 2. order_inquiry_replies table ────────────────────────────────────────
  await knex.schema.createTable('order_inquiry_replies', (table) => {
    table.increments('id').primary();
    table
      .integer('inquiry_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('order_inquiries')
      .onDelete('CASCADE');
    table.enum('sender_type', ['customer', 'admin']).notNullable();
    table
      .integer('sender_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('sender_name', 255).notNullable();
    table.text('message').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['inquiry_id'], 'idx_inquiry_replies_inquiry');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_inquiry_replies');
  await knex.schema.dropTableIfExists('order_inquiries');
}
