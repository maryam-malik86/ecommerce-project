import type { Knex } from 'knex';

// Migration 018: Deprecate flat catalog fields
//
// ⚠️  GATED MIGRATION — do NOT run until the backfill script has been executed
// and verified:
//   packages/database/scripts/backfill_catalog_data.ts
//
// Removes columns that have been superseded by the new dynamic catalog tables:
//
//   products.department  → top-level category node in the categories tree
//   products.season      → collection in the collections table
//   products.colors      → product_options "Color" + option_values rows
//   products.materials   → product_options "Material" + option_values rows
//   products.category_id → product_categories join table (migration 017)
//
//   product_variants.option_label → v_variant_display view (migration 016 + views)
//
// MySQL NOTE: A foreign key constraint must be dropped before its column can be
// removed. We detect the FK name dynamically from information_schema so this is
// safe whether the constraint was auto-named by Knex or named explicitly.

export async function up(knex: Knex): Promise<void> {
  // ── 1. Drop products.category_id (has a FK constraint in MySQL) ────────────
  const hasCategory = await knex.schema.hasColumn('products', 'category_id');
  if (hasCategory) {
    // Find the FK constraint name dynamically from information_schema
    const fkRows = await knex.raw(`
      SELECT CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'products'
        AND COLUMN_NAME = 'category_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    const fkName: string | undefined = fkRows[0]?.[0]?.CONSTRAINT_NAME;

    await knex.schema.alterTable('products', (table) => {
      if (fkName) table.dropForeign(['category_id'], fkName);
      table.dropColumn('category_id');
    });
  }

  // ── 2. Drop remaining flat columns that are now modelled in new tables ──────
  const hasDepartment = await knex.schema.hasColumn('products', 'department');
  const hasSeason = await knex.schema.hasColumn('products', 'season');
  const hasColors = await knex.schema.hasColumn('products', 'colors');
  const hasMaterials = await knex.schema.hasColumn('products', 'materials');

  if (hasDepartment || hasSeason || hasColors || hasMaterials) {
    await knex.schema.alterTable('products', (table) => {
      if (hasDepartment) table.dropColumn('department');
      if (hasSeason) table.dropColumn('season');
      if (hasColors) table.dropColumn('colors');
      if (hasMaterials) table.dropColumn('materials');
    });
  }

  // ── 3. Drop product_variants.option_label (superseded by v_variant_display) ─
  const hasOptionLabel = await knex.schema.hasColumn('product_variants', 'option_label');
  if (hasOptionLabel) {
    await knex.schema.alterTable('product_variants', (table) => {
      table.dropColumn('option_label');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.string('department', 100).nullable();
    table.string('season', 150).nullable();
    table.json('colors').nullable();
    table.json('materials').nullable();
    table.integer('category_id').unsigned().nullable();
  });

  await knex.schema.alterTable('product_variants', (table) => {
    table.string('option_label', 255).nullable().comment('Legacy free-text label; restored for rollback only');
  });
}
