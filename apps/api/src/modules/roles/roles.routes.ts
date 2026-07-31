import { Router, type IRouter } from 'express';
import { RolesController } from './roles.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { requirePermission } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new RolesController();

router.get('/roles', jwtAuthMiddleware, (req, res, next) => ctrl.getRoles(req, res, next));
router.get('/roles/:id', jwtAuthMiddleware, (req, res, next) => ctrl.getRoleById(req, res, next));
router.post('/roles', jwtAuthMiddleware, requirePermission('system.roles'), (req, res, next) => ctrl.createRole(req, res, next));
router.patch('/roles/:id', jwtAuthMiddleware, requirePermission('system.roles'), (req, res, next) => ctrl.updateRole(req, res, next));
router.delete('/roles/:id', jwtAuthMiddleware, requirePermission('system.roles'), (req, res, next) => ctrl.deleteRole(req, res, next));
router.get('/permissions', jwtAuthMiddleware, (req, res, next) => ctrl.getPermissions(req, res, next));

export default router;
