import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ── 1. Orders & Products Table Alterations ───────────────────────────────────────────
  await knex.raw('ALTER TABLE products MODIFY category_id INT UNSIGNED NULL;');

  const hasOrderNumber = await knex.schema.hasColumn('orders', 'order_number');
  if (!hasOrderNumber) {
    await knex.schema.alterTable('orders', (table) => {
      table.string('order_number', 30).nullable().unique();
      table.string('idempotency_key', 64).nullable().unique();
      table.decimal('subtotal_amount', 12, 2).notNullable().defaultTo(0);
      table.decimal('discount_amount', 12, 2).notNullable().defaultTo(0);
      table.decimal('shipping_amount', 12, 2).notNullable().defaultTo(0);
      table.decimal('tax_amount', 12, 2).notNullable().defaultTo(0);
      table.json('billing_address').nullable();
      table.integer('discount_id').unsigned().nullable();
    });
  }

  // ── 2. Refresh Tokens ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('refresh_tokens'))) {
    await knex.schema.createTable('refresh_tokens', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('token_hash', 255).notNullable();
      table.timestamp('expires_at').notNullable();
      table.boolean('revoked').notNullable().defaultTo(false);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── 3. Carts & Cart Items ──────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('carts'))) {
    await knex.schema.createTable('carts', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('session_token', 100).nullable();
      table.enum('status', ['active', 'converted', 'abandoned']).notNullable().defaultTo('active');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('cart_items'))) {
    await knex.schema.createTable('cart_items', (table) => {
      table.increments('id').primary();
      table.integer('cart_id').unsigned().notNullable().references('id').inTable('carts').onDelete('CASCADE');
      table.integer('variant_id').unsigned().notNullable().references('id').inTable('product_variants').onDelete('CASCADE');
      table.integer('quantity').notNullable().defaultTo(1);
    });
  }

  // ── 4. Stock Reservations (alter existing table to add cart_id if missing) ─
  const hasCartId = await knex.schema.hasColumn('stock_reservations', 'cart_id');
  if (!hasCartId) {
    await knex.schema.alterTable('stock_reservations', (table) => {
      table.integer('cart_id').unsigned().nullable().references('id').inTable('carts').onDelete('CASCADE');
    });
  }

  // ── 5. Payments ─────────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('payments'))) {
    await knex.schema.createTable('payments', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
      table.enum('provider', ['stripe', 'paypal', 'cod', 'manual']).notNullable();
      table.string('provider_transaction_id', 150).nullable();
      table.decimal('amount', 12, 2).notNullable();
      table.enum('status', ['pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded']).notNullable().defaultTo('pending');
      table.json('raw_response').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── 6. Webhook Events ──────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('webhook_events'))) {
    await knex.schema.createTable('webhook_events', (table) => {
      table.increments('id').primary();
      table.string('provider', 50).notNullable();
      table.string('provider_event_id', 150).notNullable().unique();
      table.string('event_type', 100).notNullable();
      table.json('payload').nullable();
      table.timestamp('processed_at').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── 7. Fulfillments & Items ────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('fulfillments'))) {
    await knex.schema.createTable('fulfillments', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
      table.enum('status', ['pending', 'packed', 'shipped', 'delivered', 'cancelled']).notNullable().defaultTo('pending');
      table.string('carrier', 100).nullable();
      table.string('tracking_number', 150).nullable();
      table.timestamp('shipped_at').nullable();
      table.timestamp('delivered_at').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  if (!(await knex.schema.hasTable('fulfillment_items'))) {
    await knex.schema.createTable('fulfillment_items', (table) => {
      table.integer('fulfillment_id').unsigned().notNullable().references('id').inTable('fulfillments').onDelete('CASCADE');
      table.integer('order_item_id').unsigned().notNullable().references('id').inTable('order_items').onDelete('CASCADE');
      table.integer('quantity').notNullable();
      table.primary(['fulfillment_id', 'order_item_id']);
    });
  }

  // ── 8. Product Options & Normalized Variants ──────────────────────────────
  if (!(await knex.schema.hasTable('product_options'))) {
    await knex.schema.createTable('product_options', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.string('name', 50).notNullable();
    });
  }

  if (!(await knex.schema.hasTable('product_option_values'))) {
    await knex.schema.createTable('product_option_values', (table) => {
      table.increments('id').primary();
      table.integer('option_id').unsigned().notNullable().references('id').inTable('product_options').onDelete('CASCADE');
      table.string('value', 100).notNullable();
    });
  }

  if (!(await knex.schema.hasTable('variant_option_values'))) {
    await knex.schema.createTable('variant_option_values', (table) => {
      table.integer('variant_id').unsigned().notNullable().references('id').inTable('product_variants').onDelete('CASCADE');
      table.integer('option_value_id').unsigned().notNullable().references('id').inTable('product_option_values').onDelete('CASCADE');
      table.primary(['variant_id', 'option_value_id']);
    });
  }

  // ── 9. SEO & Product Images ────────────────────────────────────────────────
  const hasProductSeo = await knex.schema.hasColumn('products', 'seo_title');
  if (!hasProductSeo) {
    await knex.schema.alterTable('products', (table) => {
      table.string('seo_title', 160).nullable();
      table.string('seo_description', 320).nullable();
    });
  }

  const hasCategorySeo = await knex.schema.hasColumn('categories', 'seo_title');
  if (!hasCategorySeo) {
    await knex.schema.alterTable('categories', (table) => {
      table.string('seo_title', 160).nullable();
      table.string('seo_description', 320).nullable();
    });
  }

  if (!(await knex.schema.hasTable('product_images'))) {
    await knex.schema.createTable('product_images', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE');
      table.string('url', 500).notNullable();
      table.string('alt_text', 200).nullable();
      table.integer('sort_order').notNullable().defaultTo(0);
    });
  }

  // ── 10. Discounts ───────────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('discounts'))) {
    await knex.schema.createTable('discounts', (table) => {
      table.increments('id').primary();
      table.string('code', 50).notNullable().unique();
      table.enum('type', ['percentage', 'fixed']).notNullable();
      table.decimal('value', 10, 2).notNullable();
      table.decimal('min_order_amount', 10, 2).notNullable().defaultTo(0);
      table.timestamp('starts_at').nullable();
      table.timestamp('ends_at').nullable();
      table.integer('usage_limit').nullable();
      table.integer('times_used').notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });

    await knex.schema.alterTable('orders', (table) => {
      table.foreign('discount_id').references('id').inTable('discounts').onDelete('SET NULL');
    });
  }

  // ── 11. Email Campaigns ────────────────────────────────────────────────────
  if (!(await knex.schema.hasTable('email_campaigns'))) {
    await knex.schema.createTable('email_campaigns', (table) => {
      table.increments('id').primary();
      table.string('subject', 200).notNullable();
      table.text('html_body', 'longtext').notNullable();
      table.enum('status', ['draft', 'sending', 'sent']).notNullable().defaultTo('draft');
      table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('sent_at').nullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  // ── 12. Permissions & User Permissions ─────────────────────────────────────
  if (!(await knex.schema.hasTable('permissions'))) {
    await knex.schema.createTable('permissions', (table) => {
      table.increments('id').primary();
      table.string('code', 50).notNullable().unique();
    });
  }

  if (!(await knex.schema.hasTable('user_permissions'))) {
    await knex.schema.createTable('user_permissions', (table) => {
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
      table.primary(['user_id', 'permission_id']);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('email_campaigns');
  await knex.schema.dropTableIfExists('discounts');
  await knex.schema.dropTableIfExists('product_images');
  await knex.schema.dropTableIfExists('variant_option_values');
  await knex.schema.dropTableIfExists('product_option_values');
  await knex.schema.dropTableIfExists('product_options');
  await knex.schema.dropTableIfExists('fulfillment_items');
  await knex.schema.dropTableIfExists('fulfillments');
  await knex.schema.dropTableIfExists('webhook_events');
  await knex.schema.dropTableIfExists('payments');
  await knex.schema.dropTableIfExists('cart_items');
  await knex.schema.dropTableIfExists('carts');
  await knex.schema.dropTableIfExists('refresh_tokens');
}
