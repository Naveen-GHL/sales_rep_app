import { Router } from 'express';
import { getUsers, createUser, getUserById, updateUser, disableUser, enableUser } from './userController';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permission';
import { PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.USERS_VIEW), getUsers);
router.post('/', requirePermission(PERMISSIONS.USERS_MANAGE), createUser);
router.get('/:id', requirePermission(PERMISSIONS.USERS_VIEW), getUserById);
router.put('/:id', requirePermission(PERMISSIONS.USERS_MANAGE), updateUser);
router.post('/:id/disable', requirePermission(PERMISSIONS.USERS_MANAGE), disableUser);
router.post('/:id/enable', requirePermission(PERMISSIONS.USERS_MANAGE), enableUser);

export default router;
