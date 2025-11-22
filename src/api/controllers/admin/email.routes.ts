// src/api/controllers/admin/email.routes.ts
import { Router } from 'express';
import { authenticate, checkRole } from '../../../middleware/auth';
import { getEmailTemplates, updateEmailTemplate } from './email.controller';

const router = Router();

// Protect all admin email routes
router.use(authenticate);
router.use(checkRole(['admin']));

// GET /api/admin/email-templates - Get all email templates
router.get('/email-templates', getEmailTemplates);

// PUT /api/admin/email-templates/:trigger - Update email template
router.put('/email-templates/:trigger', updateEmailTemplate);

export default router;
