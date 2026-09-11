import { Router } from 'express';
import {
  getInvestors,
  createInvestor,
  getInvestorById,
  updateInvestor,
} from './investorController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.INVESTORS));

router.get('/', requirePermission(PERMISSIONS.INVESTORS_VIEW), getInvestors);
router.post('/', requirePermission(PERMISSIONS.INVESTORS_CREATE), createInvestor);
router.get('/:id', requirePermission(PERMISSIONS.INVESTORS_VIEW), getInvestorById);
router.put('/:id', requirePermission(PERMISSIONS.INVESTORS_CREATE), updateInvestor);

export default router;
