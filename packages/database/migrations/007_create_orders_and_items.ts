import type { Knex } from 'knex';

// Migration 007: Orders + Order Items
//
// CRITICAL — Price Snapshotting:
// unit_cost_price and unit_selling_price are copied from product_variants
// at the exact moment the order is placed. They are NEVER updated after
// insertion. This guarantees profit calculations remain accurate even
// when variant prices change in the future.
//
// Net Profit Formula (per order):
//   SUM( (unit_selling_price - unit_cost_price) * quantity )

export async function up(knex: Knex): Promise<void> {
  // ── Orders ────────────────────────────────────────────────────────────────
  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT');
    table
      .enum('status', [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ])
      .notNullable()
      .defaultTo('pending');
    table
      .enum('payment_status', ['unpaid', 'paid', 'partially_paid', 'refunded'])
      .notNullable()
      .defaultTo('unpaid');
    table.json('shipping_address').notNullable();
    table.text('notes').nullable();
    table.decimal('total_amount', 12, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index(['user_id'], 'idx_orders_user');
    table.index(['status'], 'idx_orders_status');
    table.index(['payment_status'], 'idx_orders_payment');
    table.index(['created_at'], 'idx_orders_created_at');
  });

  // ── Order Items (Price-Snapshotted) ───────────────────────────────────────
  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary();
    table
      .integer('order_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('orders')
      .onDelete('CASCADE');
    table
      .integer('variant_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product_variants')
      .onDelete('RESTRICT');
    table.integer('quantity').unsigned().notNullable();

    // ← Price snapshot columns: READ-ONLY after insert ─────────────────────
    table
      .decimal('unit_cost_price', 10, 2)
      .notNullable()
      .comment('Snapshot of variant cost_price at time of purchase');
    table
      .decimal('unit_selling_price', 10, 2)
      .notNullable()
      .comment('Snapshot of variant selling_price at time of purchase');
    table
      .decimal('line_total', 12, 2)
      .notNullable()
      .comment('unit_selling_price × quantity');

    table.index(['order_id'], 'idx_order_items_order');
    table.index(['variant_id'], 'idx_order_items_variant');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
}
