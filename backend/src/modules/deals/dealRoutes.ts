import { Router } from 'express';
import {
  getDeals,
  getPipeline,
  createDeal,
  getDealById,
  updateDeal,
  deleteDeal,
  updateStage,
  markWon,
  markLost,
} from './dealController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/pipeline', requirePermission(PERMISSIONS.DEALS_VIEW), getPipeline);
router.get('/', requirePermission(PERMISSIONS.DEALS_VIEW), getDeals);
router.post('/', requirePermission(PERMISSIONS.DEALS_CREATE), createDeal);
router.get('/:id', requirePermission(PERMISSIONS.DEALS_VIEW), getDealById);
router.put('/:id', requirePermission(PERMISSIONS.DEALS_UPDATE), updateDeal);
router.delete('/:id', requirePermission(PERMISSIONS.DEALS_DELETE), deleteDeal);
router.post('/:id/stage', requirePermission(PERMISSIONS.DEALS_UPDATE), updateStage);
router.post('/:id/won', requirePermission(PERMISSIONS.DEALS_UPDATE), markWon);
router.post('/:id/lost', requirePermission(PERMISSIONS.DEALS_UPDATE), markLost);

export default router;
