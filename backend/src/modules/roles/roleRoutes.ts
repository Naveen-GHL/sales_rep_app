import { Router } from 'express';
import { getRoles, updateRolePermissions, getPermissionsList, getFeaturesList } from './roleController';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate);

router.get('/roles', requirePermission(PERMISSIONS.ROLES_VIEW), getRoles);
router.put('/roles/:code', requirePermission(PERMISSIONS.ROLES_MANAGE), updateRolePermissions);
router.get('/permissions', getPermissionsList);
router.get('/features', getFeaturesList);

export default router;
