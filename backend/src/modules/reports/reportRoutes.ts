import { Router } from 'express';
import {
  getLeadReport,
  getCallReport,
  getFollowupReport,
  getConversionReport,
  getAgentPerformanceReport,
  getLeadSourcesReport,
  getDealsReport,
  exportReport,
} from './reportController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.REPORTS));

router.get('/leads', requirePermission(PERMISSIONS.REPORTS_VIEW), getLeadReport);
router.get('/calls', requirePermission(PERMISSIONS.REPORTS_VIEW), getCallReport);
router.get('/followups', requirePermission(PERMISSIONS.REPORTS_VIEW), getFollowupReport);
router.get('/conversion', requirePermission(PERMISSIONS.REPORTS_VIEW), getConversionReport);
router.get('/agent-performance', requirePermission(PERMISSIONS.REPORTS_VIEW), getAgentPerformanceReport);
router.get('/lead-sources', requirePermission(PERMISSIONS.REPORTS_VIEW), getLeadSourcesReport);
router.get('/deals', requirePermission(PERMISSIONS.REPORTS_VIEW), getDealsReport);
router.get('/:type/export', requirePermission(PERMISSIONS.REPORTS_EXPORT), exportReport);

export default router;
