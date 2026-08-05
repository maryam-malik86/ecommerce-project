/**
 * backfill_catalog_data.ts
 *
 * One-off backfill script — run BEFORE applying migration 018.
 *
 * What it does:
 *  1. Distinct `department` values → top-level category nodes (rank 0)
 *  2. Distinct `season` values     → collections (name + slug)
 *  3. Per-product `colors` array   → product_option "Color" + option_values
 *  4. Per-product `materials` array→ product_option "Material" + option_values
 *  5. Creates a default variant per product linked to the first color+material
 *     option values (if any), otherwise a bare "Standard" variant.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register \
 *     packages/database/scripts/backfill_catalog_data.ts
 *
 * After running: verify counts, then apply migration 018.
 */

import knexLib from 'knex';
import knexConfig from '../knexfile.js';

const knex = knexLib(knexConfig);

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('▶ Starting catalog backfill…\n');

  // ── 1. Departments → top-level categories ─────────────────────────────────
  const products = await knex('products').select(
    'id', 'department', 'season', 'colors', 'materials',
    'cost_price', 'proposed_retail', 'proposed_qty', 'image_url',
  );

  const departments = [...new Set(
    products.map((p) => p.department).filter(Boolean) as string[]
  )];

  const deptCategoryMap: Record<string, number> = {};

  for (const dept of departments) {
    const existing = await knex('categories').where({ name: dept }).first();
    if (existing) {
      deptCategoryMap[dept] = existing.id;
      console.log(`  ✓ Department category already exists: "${dept}" (id=${existing.id})`);
    } else {
      const slug = toSlug(dept);
      const [id] = await knex('categories').insert({
        name: dept,
        slug,
        description: null,
        parent_id: null,
        rank: 0,
        created_at: new Date(),
        updated_at: new Date(),
      });
      deptCategoryMap[dept] = id as number;
      console.log(`  + Created department category: "${dept}" (id=${id})`);
    }
  }

  // ── 2. Seasons → collections ───────────────────────────────────────────────
  const seasons = [...new Set(
    products.map((p) => p.season).filter(Boolean) as string[]
  )];

  const seasonCollectionMap: Record<string, number> = {};

  for (const season of seasons) {
    const existing = await knex('collections').where({ name: season }).first();
    if (existing) {
      seasonCollectionMap[season] = existing.id;
      console.log(`  ✓ Collection already exists: "${season}" (id=${existing.id})`);
    } else {
      const slug = toSlug(season);
      const [id] = await knex('collections').insert({
        name: season,
        slug,
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      seasonCollectionMap[season] = id as number;
      console.log(`  + Created collection: "${season}" (id=${id})`);
    }
  }

  // ── 3 & 4. Colors + Materials → product_options + option_values ───────────
  console.log('\n▶ Processing per-product options…');

  for (const product of products) {
    const productId: number = product.id;

    // Link department → product_categories (in addition to migration 017 backfill)
    if (product.department && deptCategoryMap[product.department]) {
      const deptCatId = deptCategoryMap[product.department];
      const exists = await knex('product_categories')
        .where({ product_id: productId, category_id: deptCatId }).first();
      if (!exists) {
        await knex('product_categories').insert({
          product_id: productId,
          category_id: deptCatId,
          is_primary: false,
        });
      }
    }

    // Link season → product_collections
    if (product.season && seasonCollectionMap[product.season]) {
      const colId = seasonCollectionMap[product.season];
      const exists = await knex('product_collections')
        .where({ product_id: productId, collection_id: colId }).first();
      if (!exists) {
        await knex('product_collections').insert({
          product_id: productId,
          collection_id: colId,
        });
      }
    }

    // Parse JSON arrays safely
    let colors: string[] = [];
    let materials: string[] = [];
    try { colors = JSON.parse(product.colors || '[]'); } catch { colors = []; }
    try { materials = JSON.parse(product.materials || '[]'); } catch { materials = []; }

    const optionValueIds: { colorId?: number; materialId?: number } = {};

    // Create "Color" option + values
    if (colors.length > 0) {
      const existingOpt = await knex('product_options')
        .where({ product_id: productId, name: 'Color' }).first();
      const optionId = existingOpt
        ? existingOpt.id
        : (await knex('product_options').insert({
          product_id: productId,
          name: 'Color',
          created_at: new Date(),
          updated_at: new Date(),
        }))[0];

      for (const color of colors) {
        const existingVal = await knex('option_values')
          .where({ option_id: optionId, value: color }).first();
        const valId = existingVal
          ? existingVal.id
          : (await knex('option_values').insert({
            option_id: optionId,
            value: color,
            created_at: new Date(),
            updated_at: new Date(),
          }))[0];
        if (!optionValueIds.colorId) optionValueIds.colorId = valId as number;
      }
    }

    // Create "Material" option + values
    if (materials.length > 0) {
      const existingOpt = await knex('product_options')
        .where({ product_id: productId, name: 'Material' }).first();
      const optionId = existingOpt
        ? existingOpt.id
        : (await knex('product_options').insert({
          product_id: productId,
          name: 'Material',
          created_at: new Date(),
          updated_at: new Date(),
        }))[0];

      for (const mat of materials) {
        const existingVal = await knex('option_values')
          .where({ option_id: optionId, value: mat }).first();
        const valId = existingVal
          ? existingVal.id
          : (await knex('option_values').insert({
            option_id: optionId,
            value: mat,
            created_at: new Date(),
            updated_at: new Date(),
          }))[0];
        if (!optionValueIds.materialId) optionValueIds.materialId = valId as number;
      }
    }

    // ── 5. Ensure a default variant exists with option value links ──────────
    const existingVariants = await knex('product_variants').where({ product_id: productId });
    if (existingVariants.length === 0) {
      const sku = `BKFL-${productId}-STD`;
      const [variantId] = await knex('product_variants').insert({
        product_id: productId,
        sku,
        option_label: 'Standard',
        cost_price: product.cost_price || 0,
        selling_price: product.proposed_retail || 0,
        stock_quantity: product.proposed_qty || 0,
        low_stock_threshold: 5,
        image_url: product.image_url || null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (optionValueIds.colorId) {
        await knex('variant_option_values').insert({
          variant_id: variantId,
          option_value_id: optionValueIds.colorId,
        });
      }
      if (optionValueIds.materialId) {
        await knex('variant_option_values').insert({
          variant_id: variantId,
          option_value_id: optionValueIds.materialId,
        });
      }
      console.log(`  + Created default variant for product ${productId} (sku=${sku})`);
    } else {
      // Link existing first variant to option values if not already linked
      const firstVariant = existingVariants[0];
      for (const ovId of [optionValueIds.colorId, optionValueIds.materialId]) {
        if (!ovId) continue;
        const exists = await knex('variant_option_values')
          .where({ variant_id: firstVariant.id, option_value_id: ovId }).first();
        if (!exists) {
          await knex('variant_option_values').insert({
            variant_id: firstVariant.id,
            option_value_id: ovId,
          });
        }
      }
    }
  }

  console.log('\n✅ Backfill complete. Verify data, then run migration 018.');
  await knex.destroy();
}

main().catch((err) => {
  console.error('❌ Backfill failed:', err);
  knex.destroy();
  process.exit(1);
});
