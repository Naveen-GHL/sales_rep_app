import { Router } from 'express';
import {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  assignLead,
  convertLead,
  exportLeads,
} from './leadController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/export', requirePermission(PERMISSIONS.LEADS_EXPORT), exportLeads);
router.get('/', requirePermission(PERMISSIONS.LEADS_VIEW), getLeads);
router.post('/', requirePermission(PERMISSIONS.LEADS_CREATE), createLead);
router.get('/:id', requirePermission(PERMISSIONS.LEADS_VIEW), getLeadById);
router.put('/:id', requirePermission(PERMISSIONS.LEADS_UPDATE), updateLead);
router.delete('/:id', requirePermission(PERMISSIONS.LEADS_DELETE), deleteLead);
router.post('/:id/assign', requirePermission(PERMISSIONS.LEADS_ASSIGN), assignLead);
router.post('/:id/convert', requirePermission(PERMISSIONS.LEADS_CONVERT), convertLead);

export default router;
