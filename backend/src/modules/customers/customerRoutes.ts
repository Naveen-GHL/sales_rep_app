import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  getCustomerCalls,
  getCustomerFollowups,
  getCustomerDeals,
} from './customerController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), getCustomers);
router.post('/', requirePermission(PERMISSIONS.CUSTOMERS_CREATE), createCustomer);
router.get('/:id', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), getCustomerById);
router.put('/:id', requirePermission(PERMISSIONS.CUSTOMERS_UPDATE), updateCustomer);
router.delete('/:id', requirePermission(PERMISSIONS.CUSTOMERS_DELETE), deleteCustomer);
router.get('/:id/calls', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), getCustomerCalls);
router.get('/:id/followups', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), getCustomerFollowups);
router.get('/:id/deals', requirePermission(PERMISSIONS.CUSTOMERS_VIEW), getCustomerDeals);

export default router;
