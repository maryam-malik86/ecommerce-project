import { Router, type IRouter } from 'express';
import { MarketingController } from './marketing.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new MarketingController();

// Public: subscribe / unsubscribe (no auth required)
router.post('/newsletter/subscribe', (req, res, next) => ctrl.subscribe(req, res, next));
router.post('/newsletter/unsubscribe', (req, res, next) => ctrl.unsubscribe(req, res, next));

// Admin only: view subscribers and broadcast
router.get('/newsletter/subscribers', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.getSubscribers(req, res, next));
router.post('/newsletter/broadcast', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.broadcast(req, res, next));

export default router;
