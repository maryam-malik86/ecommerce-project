import { Router, type IRouter } from 'express';
import { SettingsController } from './settings.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new SettingsController();

router.get('/', jwtAuthMiddleware, (req, res, next) => ctrl.getSettings(req, res, next));
router.patch('/', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateSettings(req, res, next));

export default router;
