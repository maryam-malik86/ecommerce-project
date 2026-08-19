import { Router, type IRouter } from 'express';
import { OrderInquiriesController } from './order-inquiries.controller.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';
import { rbac } from '../../middlewares/rbac.middleware.js';

const router: IRouter = Router();
const ctrl = new OrderInquiriesController();

// POST /order-inquiries — Public submission (no auth required for guest customer inquiries)
router.post('/', (req, res, next) => ctrl.createInquiry(req, res, next));

// All subsequent inquiry routes require JWT authentication
router.use(jwtAuthMiddleware);

// GET /order-inquiries — Admin list inquiries
router.get('/', rbac('admin'), (req, res, next) => ctrl.listInquiries(req, res, next));

// GET /order-inquiries/:id
router.get('/:id', (req, res, next) => ctrl.getInquiry(req, res, next));

// PATCH /order-inquiries/:id/status — Admin update status/priority
router.patch('/:id/status', rbac('admin'), (req, res, next) => ctrl.updateStatus(req, res, next));

// POST /order-inquiries/:id/replies — Admin or Customer add reply to thread
router.post('/:id/replies', (req, res, next) => ctrl.addReply(req, res, next));

// DELETE /order-inquiries/:id — Admin delete
router.delete('/:id', rbac('admin'), (req, res, next) => ctrl.deleteInquiry(req, res, next));

export default router;
