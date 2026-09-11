import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from './notificationController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);

export default router;
