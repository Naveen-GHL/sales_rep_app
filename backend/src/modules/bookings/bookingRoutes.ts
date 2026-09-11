import { Router } from 'express';
import {
  getBookings,
  createBooking,
  getBookingById,
  updateBooking,
  confirmBooking,
  cancelBooking,
} from './bookingController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.BOOKINGS));

router.get('/', requirePermission(PERMISSIONS.BOOKINGS_VIEW), getBookings);
router.post('/', requirePermission(PERMISSIONS.BOOKINGS_CREATE), createBooking);
router.get('/:id', requirePermission(PERMISSIONS.BOOKINGS_VIEW), getBookingById);
router.put('/:id', requirePermission(PERMISSIONS.BOOKINGS_CREATE), updateBooking);
router.post('/:id/confirm', requirePermission(PERMISSIONS.BOOKINGS_CREATE), confirmBooking);
router.post('/:id/cancel', requirePermission(PERMISSIONS.BOOKINGS_CREATE), cancelBooking);

export default router;
