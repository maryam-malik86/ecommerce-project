import { Router, type IRouter } from 'express';
import { OrdersController } from './orders.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new OrdersController();

// Public storefront guest checkout (no auth required)
router.post('/public-checkout', (req, res, next) => ctrl.publicCheckout(req, res, next));

// All subsequent order routes require JWT authentication
router.use(jwtAuthMiddleware);

// POST /orders/checkout — customers place orders
router.post('/checkout', rbac('customer'), (req, res, next) => ctrl.checkout(req, res, next));

// POST /orders — admin manual order creation
router.post('/', rbac('admin'), (req, res, next) => ctrl.checkout(req, res, next));

// GET /orders — admin sees all, customer sees own
router.get('/', (req, res, next) => ctrl.listOrders(req, res, next));

// PATCH /orders/bulk-status — admin only
router.patch('/bulk-status', rbac('admin'), (req, res, next) => ctrl.bulkUpdateStatus(req, res, next));

// POST /orders/bulk-delete — admin only
router.post('/bulk-delete', rbac('admin'), (req, res, next) => ctrl.bulkDelete(req, res, next));

// GET /orders/:id
router.get('/:id', (req, res, next) => ctrl.getOrder(req, res, next));

// PATCH /orders/:id/status — admin only
router.patch('/:id/status', rbac('admin'), (req, res, next) => ctrl.updateStatus(req, res, next));

// DELETE /orders/:id — admin only
router.delete('/:id', rbac('admin'), (req, res, next) => ctrl.deleteOrder(req, res, next));

export default router;

