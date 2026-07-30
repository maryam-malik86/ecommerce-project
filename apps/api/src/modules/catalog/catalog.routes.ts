import { Router, type IRouter } from 'express';
import { CatalogController } from './catalog.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new CatalogController();

// Public catalog endpoints
router.get('/categories', (req, res, next) => ctrl.getCategories(req, res, next));
router.get('/products', (req, res, next) => ctrl.getProducts(req, res, next));
router.get('/products/:id', (req, res, next) => ctrl.getProduct(req, res, next));

// Admin-only category endpoints
router.post('/categories', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createCategory(req, res, next));
router.patch('/categories/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateCategory(req, res, next));
router.delete('/categories/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteCategory(req, res, next));

// Admin-only product endpoints
router.post('/products', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.createProduct(req, res, next));
router.patch('/products/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.updateProduct(req, res, next));
router.delete('/products/:id', jwtAuthMiddleware, rbac('admin'), (req, res, next) => ctrl.deleteProduct(req, res, next));

export default router;
