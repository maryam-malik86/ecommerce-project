import { Router, type IRouter } from 'express';
import { InventoryController } from './inventory.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new InventoryController();

// All inventory routes require authentication
router.use(jwtAuthMiddleware);

// Admin + supplier can read suppliers
router.get('/suppliers', rbac('admin', 'supplier'), (req, res, next) => ctrl.getSuppliers(req, res, next));
router.post('/suppliers', rbac('admin'), (req, res, next) => ctrl.createSupplier(req, res, next));
router.patch('/suppliers/:id', rbac('admin'), (req, res, next) => ctrl.updateSupplier(req, res, next));
router.delete('/suppliers/:id', rbac('admin'), (req, res, next) => ctrl.deleteSupplier(req, res, next));

// Stock movements
router.post('/movements', rbac('admin', 'supplier'), (req, res, next) => ctrl.recordMovement(req, res, next));
router.get('/variants/:variantId/movements', rbac('admin'), (req, res, next) => ctrl.getVariantMovements(req, res, next));

// Low stock alerts — admin only
router.get('/low-stock', rbac('admin'), (req, res, next) => ctrl.getLowStockAlerts(req, res, next));

export default router;
