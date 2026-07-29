import { Router, type IRouter } from 'express';
import { OrdersController } from './orders.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new OrdersController();

// All order routes require JWT authentication
router.use(jwtAuthMiddleware);

// POST /orders/checkout — customers place orders
router.post('/checkout', rbac('customer'), (req, res, next) => ctrl.checkout(req, res, next));

// GET /orders — admin sees all, customer sees own
router.get('/', (req, res, next) => ctrl.listOrders(req, res, next));

// GET /orders/:id
router.get('/:id', (req, res, next) => ctrl.getOrder(req, res, next));

// PATCH /orders/:id/status — admin only
router.patch('/:id/status', rbac('admin'), (req, res, next) => ctrl.updateStatus(req, res, next));

export default router;
