import type { Knex } from 'knex';

// Migration 006: Inventory — Stock Movements (ledger) + Stock Reservations
//
// stock_movements: Immutable audit ledger — every stock IN/OUT is recorded.
//   This is the source of truth for inventory history.
//
// stock_reservations: Soft reservations created during checkout.
//   Prevents overselling between "add to cart" and "payment confirmed".
//   Reservations are confirmed (→ stock_movements out) or released on timeout.

export async function up(knex: Knex): Promise<void> {
  // ── Stock Movements Ledger ────────────────────────────────────────────────
  await knex.schema.createTable('stock_movements', (table) => {
    table.increments('id').primary();
    table
      .integer('variant_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product_variants')
      .onDelete('RESTRICT');
    table.integer('supplier_id').unsigned().nullable().references('id').inTable('suppliers').onDelete('SET NULL');
    table.integer('order_id').unsigned().nullable().comment('Set when movement is linked to an order');
    table
      .enum('type', ['in', 'out', 'reserved', 'released', 'adjustment'])
      .notNullable();
    table
      .integer('quantity')
      .notNullable()
      .comment('Positive for additions, negative for deductions');
    table.text('note').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['variant_id'], 'idx_movements_variant');
    table.index(['type'], 'idx_movements_type');
    table.index(['created_at'], 'idx_movements_created_at');
    table.index(['order_id'], 'idx_movements_order');
  });

  // ── Stock Reservations (concurrency control) ──────────────────────────────
  await knex.schema.createTable('stock_reservations', (table) => {
    table.increments('id').primary();
    table
      .integer('variant_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('product_variants')
      .onDelete('CASCADE');
    table.integer('order_id').unsigned().nullable();
    table.integer('quantity').unsigned().notNullable();
    table
      .enum('status', ['pending', 'confirmed', 'released', 'expired'])
      .notNullable()
      .defaultTo('pending');
    table.timestamp('expires_at').notNullable().comment('Reservation TTL — auto-expire abandoned carts');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    table.index(['variant_id', 'status'], 'idx_reservations_variant_status');
    table.index(['expires_at'], 'idx_reservations_expires_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stock_reservations');
  await knex.schema.dropTableIfExists('stock_movements');
}
