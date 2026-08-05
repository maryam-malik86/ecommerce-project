-- ============================================================
-- Catalog Views
-- Apply via: packages/database/scripts/apply_views.ts
-- or run directly against your DB with: knex seed:run --specific apply_views
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- v_catalog_products
-- One row per product with price range, total stock, and primary
-- category. Powers catalog listing pages and admin dashboards.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_catalog_products;
CREATE VIEW v_catalog_products AS
SELECT
  p.id,
  p.name,
  p.brand,
  p.status,
  s.name                            AS supplier_name,
  c.name                            AS primary_category,
  COUNT(DISTINCT pv.id)             AS variant_count,
  MIN(pv.selling_price)             AS price_from,
  MAX(pv.selling_price)             AS price_to,
  COALESCE(SUM(pv.stock_quantity), 0) AS total_stock
FROM products p
LEFT JOIN suppliers         s   ON s.id  = p.supplier_id
LEFT JOIN product_categories pc ON pc.product_id = p.id AND pc.is_primary = true
LEFT JOIN categories        c   ON c.id  = pc.category_id
LEFT JOIN product_variants  pv  ON pv.product_id = p.id
GROUP BY p.id, p.name, p.brand, p.status, s.name, c.name;


-- ─────────────────────────────────────────────────────────────
-- v_low_stock_alerts
-- Every variant whose stock_quantity is at or below its threshold.
-- Powers the inventory alert screen / dashboard widget.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_low_stock_alerts;
CREATE VIEW v_low_stock_alerts AS
SELECT
  pv.id              AS variant_id,
  pv.sku,
  p.name             AS product_name,
  p.id               AS product_id,
  pv.stock_quantity,
  pv.low_stock_threshold
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
WHERE pv.stock_quantity <= pv.low_stock_threshold;


-- ─────────────────────────────────────────────────────────────
-- v_variant_display
-- Assembles the human-readable label for each variant by joining
-- its option values in option definition order.
-- e.g. variant 42 → "Red / Small"
--
-- Replaces the legacy free-text option_label column.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS v_variant_display;
CREATE VIEW v_variant_display AS
SELECT
  pv.id   AS variant_id,
  pv.sku,
  GROUP_CONCAT(ov.value ORDER BY po.id SEPARATOR ' / ') AS display_label
FROM product_variants     pv
JOIN variant_option_values vov ON vov.variant_id     = pv.id
JOIN option_values         ov  ON ov.id              = vov.option_value_id
JOIN product_options       po  ON po.id              = ov.option_id
GROUP BY pv.id, pv.sku;

-- NOTE: If using PostgreSQL replace GROUP_CONCAT(...) with:
--   STRING_AGG(ov.value, ' / ' ORDER BY po.id)
