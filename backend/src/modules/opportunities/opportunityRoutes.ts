import { Router } from 'express';
import {
  getOpportunities,
  createOpportunity,
  getOpportunityById,
  updateOpportunity,
  updateOpportunityStage,
} from './opportunityController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.INVESTMENT_OPPORTUNITIES));

router.get('/', requirePermission(PERMISSIONS.OPPORTUNITIES_VIEW), getOpportunities);
router.post('/', requirePermission(PERMISSIONS.OPPORTUNITIES_CREATE), createOpportunity);
router.get('/:id', requirePermission(PERMISSIONS.OPPORTUNITIES_VIEW), getOpportunityById);
router.put('/:id', requirePermission(PERMISSIONS.OPPORTUNITIES_CREATE), updateOpportunity);
router.post('/:id/stage', requirePermission(PERMISSIONS.OPPORTUNITIES_CREATE), updateOpportunityStage);

export default router;
