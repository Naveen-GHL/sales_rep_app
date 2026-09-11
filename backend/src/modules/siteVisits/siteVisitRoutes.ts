import { Router } from 'express';
import {
  getSiteVisits,
  createSiteVisit,
  getSiteVisitById,
  updateSiteVisit,
  completeSiteVisit,
  rescheduleSiteVisit,
} from './siteVisitController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.SITE_VISITS));

router.get('/', requirePermission(PERMISSIONS.SITE_VISITS_VIEW), getSiteVisits);
router.post('/', requirePermission(PERMISSIONS.SITE_VISITS_CREATE), createSiteVisit);
router.get('/:id', requirePermission(PERMISSIONS.SITE_VISITS_VIEW), getSiteVisitById);
router.put('/:id', requirePermission(PERMISSIONS.SITE_VISITS_CREATE), updateSiteVisit);
router.post('/:id/complete', requirePermission(PERMISSIONS.SITE_VISITS_CREATE), completeSiteVisit);
router.post('/:id/reschedule', requirePermission(PERMISSIONS.SITE_VISITS_CREATE), rescheduleSiteVisit);

export default router;
