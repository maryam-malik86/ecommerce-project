import { Router, type IRouter } from 'express';
import { AuthController } from './auth.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';

const router: IRouter = Router();
const ctrl = new AuthController();

// POST /auth/register
router.post('/register', (req, res, next) => ctrl.register(req, res, next));

// POST /auth/login
router.post('/login', (req, res, next) => ctrl.login(req, res, next));

// GET /auth/me — protected
router.get('/me', jwtAuthMiddleware, (req, res, next) => ctrl.getProfile(req, res, next));

// Users management — admin only
router.get('/users', jwtAuthMiddleware, (req, res, next) => ctrl.getUsers(req, res, next));
router.post('/users', jwtAuthMiddleware, (req, res, next) => ctrl.register(req, res, next));
router.patch('/users/:id', jwtAuthMiddleware, (req, res, next) => ctrl.updateUser(req, res, next));
router.delete('/users/:id', jwtAuthMiddleware, (req, res, next) => ctrl.deleteUser(req, res, next));

export default router;
