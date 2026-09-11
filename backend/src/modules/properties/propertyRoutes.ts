import { Router } from 'express';
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  getProjectPlots,
  getPlots,
  createPlot,
  getPlotById,
  updatePlot,
  holdPlot,
  releasePlot,
} from './propertyController';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenant';
import { requireFeature } from '../../middleware/feature';
import { requirePermission } from '../../middleware/permission';
import { FEATURES, PERMISSIONS } from '../../config/constants';

const router = Router();

router.use(authenticate, resolveTenant, requireFeature(FEATURES.PROPERTIES));

// Projects
router.get('/projects', requirePermission(PERMISSIONS.PROPERTIES_VIEW), getProjects);
router.post('/projects', requirePermission(PERMISSIONS.PROPERTIES_UPDATE), createProject);
router.get('/projects/:id', requirePermission(PERMISSIONS.PROPERTIES_VIEW), getProjectById);
router.put('/projects/:id', requirePermission(PERMISSIONS.PROPERTIES_UPDATE), updateProject);
router.get('/projects/:id/plots', requirePermission(PERMISSIONS.PROPERTIES_VIEW), getProjectPlots);

// Plots
router.get('/plots', requirePermission(PERMISSIONS.PROPERTIES_VIEW), getPlots);
router.post('/plots', requirePermission(PERMISSIONS.PROPERTIES_UPDATE), createPlot);
router.get('/plots/:id', requirePermission(PERMISSIONS.PROPERTIES_VIEW), getPlotById);
router.put('/plots/:id', requirePermission(PERMISSIONS.PROPERTIES_UPDATE), updatePlot);
router.post('/plots/:id/hold', requirePermission(PERMISSIONS.PROPERTIES_UPDATE), holdPlot);
router.post('/plots/:id/release', requirePermission(PERMISSIONS.PROPERTIES_UPDATE), releasePlot);

export default router;
