import { Router, type IRouter } from 'express';
import { AnalyticsController } from './analytics.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new AnalyticsController();

router.use(jwtAuthMiddleware, rbac('admin'));

router.get('/profit', (req, res, next) => ctrl.getProfitSummary(req, res, next));
router.get('/profit/by-product', (req, res, next) => ctrl.getProfitByProduct(req, res, next));
router.get('/revenue/timeseries', (req, res, next) => ctrl.getTimeSeries(req, res, next));

export default router;
