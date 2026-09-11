import { Router } from 'express';
import { getJobs, getJobById } from './jobController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';

const router = Router();

router.use(authenticate, resolveTenant);

router.get('/', getJobs);
router.get('/:id', getJobById);

export default router;
