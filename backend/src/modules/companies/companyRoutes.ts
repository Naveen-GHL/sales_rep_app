import { Router } from 'express';
import {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  updateFeatures,
  activateCompany,
  deactivateCompany,
} from './companyController';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate);

router.get('/', getCompanies);
router.post('/', requirePermission(PERMISSIONS.PLATFORM_MANAGE_COMPANIES), createCompany);
router.get('/:id', getCompanyById);
router.put('/:id', requirePermission(PERMISSIONS.PLATFORM_MANAGE_COMPANIES), updateCompany);
router.put('/:id/features', requirePermission(PERMISSIONS.PLATFORM_MANAGE_PACKAGES), updateFeatures);
router.post('/:id/activate', requirePermission(PERMISSIONS.PLATFORM_MANAGE_COMPANIES), activateCompany);
router.post('/:id/deactivate', requirePermission(PERMISSIONS.PLATFORM_MANAGE_COMPANIES), deactivateCompany);

export default router;
