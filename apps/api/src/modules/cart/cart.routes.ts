import { Router, type IRouter } from 'express';
import { CartController } from './cart.controller.js';

const router: IRouter = Router();
const ctrl = new CartController();

router.get('/', (req, res, next) => ctrl.getCart(req, res, next));
router.post('/items', (req, res, next) => ctrl.addItem(req, res, next));
router.delete('/items/:id', (req, res, next) => ctrl.removeItem(req, res, next));

export default router;
