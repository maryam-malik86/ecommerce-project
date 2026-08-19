import { Router } from 'express';
import { emailTemplatesController } from './email-templates.controller.js';
import { apiKeyMiddleware } from '../../middlewares/apiKey.middleware.js';
import { jwtAuthMiddleware } from '../../middlewares/jwtAuth.middleware.js';

const router: Router = Router();

// Protect all routes with API key and Admin JWT
router.use(apiKeyMiddleware);
router.use(jwtAuthMiddleware);

router.get('/', (req, res, next) => emailTemplatesController.getAllTemplates(req, res, next));
router.get('/:key', (req, res, next) => emailTemplatesController.getTemplateByKey(req, res, next));
router.put('/:key', (req, res, next) => emailTemplatesController.updateTemplate(req, res, next));
router.post('/:key/test-send', (req, res, next) => emailTemplatesController.sendTestEmail(req, res, next));

export default router;

