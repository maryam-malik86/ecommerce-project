import { Router, type IRouter } from 'express';
import { CatalogController } from './catalog.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new CatalogController();

// ── Suppliers (public) ────────────────────────────────────────────────────────
router.get('/suppliers', (req, res, next) => ctrl.getSuppliers(req, res, next));
router.post('/suppliers', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createSupplier(req, res, next));

// ── Categories ────────────────────────────────────────────────────────────────
// GET /catalog/categories/tree  — nested tree (for pickers / menus)
router.get('/categories/tree', (req, res, next) => ctrl.getCategoryTree(req, res, next));
// GET /catalog/categories       — flat list
router.get('/categories', (req, res, next) => ctrl.getCategories(req, res, next));
// Admin mutations
router.post('/categories', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createCategory(req, res, next));
router.patch('/categories/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateCategory(req, res, next));
router.delete('/categories/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteCategory(req, res, next));

// ── Collections ───────────────────────────────────────────────────────────────
router.get('/collections', (req, res, next) => ctrl.getCollections(req, res, next));
router.post('/collections', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createCollection(req, res, next));
router.patch('/collections/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateCollection(req, res, next));
router.delete('/collections/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteCollection(req, res, next));

// ── Products ──────────────────────────────────────────────────────────────────
router.get('/products', (req, res, next) => ctrl.getProducts(req, res, next));
router.get('/products/:id', (req, res, next) => ctrl.getProduct(req, res, next));
router.post('/products', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createProduct(req, res, next));
router.patch('/products/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateProduct(req, res, next));
router.put('/products/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateProduct(req, res, next));
router.delete('/products/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteProduct(req, res, next));

// ── Product Options ───────────────────────────────────────────────────────────
// POST /catalog/products/:id/options — define option axes (Color, Size …)
router.post('/products/:id/options', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.addOptions(req, res, next));

// ── Variant Generation ────────────────────────────────────────────────────────
// POST /catalog/products/:id/variants/generate — cartesian product → draft variants
router.post('/products/:id/variants/generate', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.generateVariants(req, res, next));

// ── Variant Patch & Delete ───────────────────────────────────────────────────
// PATCH /catalog/variants/:id — set price, cost, stock per variant
router.patch('/variants/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.patchVariant(req, res, next));
router.put('/variants/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.patchVariant(req, res, next));
// DELETE /catalog/variants/:id — delete specific variant
router.delete('/variants/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteVariant(req, res, next));

// ── Publish ───────────────────────────────────────────────────────────────────
// POST /catalog/products/:id/publish — flips status to active
router.post('/products/:id/publish', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.publishProduct(req, res, next));
router.put('/products/:id/publish', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.publishProduct(req, res, next));

// ── Inventory Alerts ──────────────────────────────────────────────────────────
// GET /catalog/inventory/low-stock
router.get('/inventory/low-stock', jwtAuthMiddleware, (req, res, next) => ctrl.getLowStockAlerts(req, res, next));

export default router;
