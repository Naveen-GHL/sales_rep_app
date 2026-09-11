import { Router } from 'express';
import {
  getConsultations,
  createConsultation,
  getConsultationById,
  updateConsultation,
  completeConsultation,
} from './consultationController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.CONSULTATIONS));

router.get('/', requirePermission(PERMISSIONS.CONSULTATIONS_VIEW), getConsultations);
router.post('/', requirePermission(PERMISSIONS.CONSULTATIONS_CREATE), createConsultation);
router.get('/:id', requirePermission(PERMISSIONS.CONSULTATIONS_VIEW), getConsultationById);
router.put('/:id', requirePermission(PERMISSIONS.CONSULTATIONS_CREATE), updateConsultation);
router.post('/:id/complete', requirePermission(PERMISSIONS.CONSULTATIONS_CREATE), completeConsultation);

export default router;
