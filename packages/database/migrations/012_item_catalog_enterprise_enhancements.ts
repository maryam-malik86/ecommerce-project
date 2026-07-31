import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Extend suppliers table with country code and flag
  const hasSuppliers = await knex.schema.hasTable('suppliers');
  if (hasSuppliers) {
    const hasCountryCode = await knex.schema.hasColumn('suppliers', 'country_code');
    if (!hasCountryCode) {
      await knex.schema.alterTable('suppliers', (table) => {
        table.string('country_code', 10).nullable().defaultTo('US');
        table.string('country_flag', 20).nullable().defaultTo('🇺🇸');
      });
    }
  }

  // 2. Extend products table with enterprise catalog attributes
  const hasProducts = await knex.schema.hasTable('products');
  if (hasProducts) {
    const hasSupplierId = await knex.schema.hasColumn('products', 'supplier_id');
    if (!hasSupplierId) {
      await knex.schema.alterTable('products', (table) => {
        table.integer('supplier_id').unsigned().nullable().references('id').inTable('suppliers').onDelete('SET NULL');
        table.string('supplier_ref', 100).nullable();
        table.string('our_ref', 100).nullable();
        table.string('ba_ref', 100).nullable();
        table.string('brand', 100).nullable();
        table.string('season', 150).nullable();
        table.string('department', 100).nullable();
        table.json('colors').nullable().comment('Array of color swatches');
        table.json('materials').nullable().comment('Array of material names');
        table.decimal('proposed_retail', 10, 2).nullable().defaultTo(0);
        table.integer('proposed_qty').unsigned().nullable().defaultTo(0);
        table.string('image_url', 500).nullable();
        table.json('photos').nullable().comment('Array of gallery photo URLs');

        table.index(['supplier_id'], 'idx_products_supplier');
        table.index(['brand'], 'idx_products_brand');
        table.index(['department'], 'idx_products_department');
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasProducts = await knex.schema.hasTable('products');
  if (hasProducts) {
    await knex.schema.alterTable('products', (table) => {
      table.dropColumn('supplier_id');
      table.dropColumn('supplier_ref');
      table.dropColumn('our_ref');
      table.dropColumn('ba_ref');
      table.dropColumn('brand');
      table.dropColumn('season');
      table.dropColumn('department');
      table.dropColumn('colors');
      table.dropColumn('materials');
      table.dropColumn('proposed_retail');
      table.dropColumn('proposed_qty');
      table.dropColumn('image_url');
      table.dropColumn('photos');
    });
  }

  const hasSuppliers = await knex.schema.hasTable('suppliers');
  if (hasSuppliers) {
    await knex.schema.alterTable('suppliers', (table) => {
      table.dropColumn('country_code');
      table.dropColumn('country_flag');
    });
  }
}
