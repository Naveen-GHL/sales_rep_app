import { Router } from 'express';
import {
  getFollowups,
  createFollowup,
  updateFollowup,
  completeFollowup,
  cancelFollowup,
  rescheduleFollowup,
} from './followupController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/', requirePermission(PERMISSIONS.FOLLOWUPS_VIEW), getFollowups);
router.post('/', requirePermission(PERMISSIONS.FOLLOWUPS_CREATE), createFollowup);
router.put('/:id', requirePermission(PERMISSIONS.FOLLOWUPS_UPDATE), updateFollowup);
router.post('/:id/complete', requirePermission(PERMISSIONS.FOLLOWUPS_UPDATE), completeFollowup);
router.post('/:id/cancel', requirePermission(PERMISSIONS.FOLLOWUPS_UPDATE), cancelFollowup);
router.post('/:id/reschedule', requirePermission(PERMISSIONS.FOLLOWUPS_UPDATE), rescheduleFollowup);

export default router;
