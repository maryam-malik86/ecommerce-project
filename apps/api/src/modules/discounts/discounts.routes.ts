import { Router, type IRouter } from 'express';
import { DiscountsController } from './discounts.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new DiscountsController();

// Storefront public promo code validation
router.post('/validate', (req, res, next) => ctrl.validateCode(req, res, next));

// Admin discount management
router.get('/', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.listDiscounts(req, res, next));
router.post('/', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createDiscount(req, res, next));
router.delete('/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteDiscount(req, res, next));

export default router;
