import { Router } from 'express';
import { getAuditLogs } from './auditLogController';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.AUDIT_VIEW), getAuditLogs);

export default router;
