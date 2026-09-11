import { Router } from 'express';
import {
  getAvailability,
  updateAvailability,
  incomingCallWebhook,
  getCalls,
  createCall,
  getCallById,
  getRecording,
} from './callController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

// Telephony incoming webhook can be unauthenticated or service-authenticated
router.post('/calls/incoming', incomingCallWebhook);

router.use(authenticate, resolveTenant);

router.get('/agent/availability', getAvailability);
router.post('/agent/availability', updateAvailability);

router.get('/calls', requirePermission(PERMISSIONS.CALLS_VIEW), getCalls);
router.post('/calls', requirePermission(PERMISSIONS.CALLS_MAKE), createCall);
router.get('/calls/:id', requirePermission(PERMISSIONS.CALLS_VIEW), getCallById);
router.get('/calls/:id/recording', requirePermission(PERMISSIONS.CALLS_RECORDINGS_PLAY), getRecording);

export default router;
