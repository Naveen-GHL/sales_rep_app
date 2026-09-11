import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export function requireFeature(featureKey: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Super Admin bypasses tenant feature restrictions
    if (req.user.roleCode === 'super_admin') {
      next();
      return;
    }

    const companyId = req.companyId || req.user.companyId;
    if (!companyId) {
      res.status(403).json({ message: 'Tenant company context required' });
      return;
    }

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: companyId },
      });

      if (!tenant || !tenant.isActive) {
        res.status(403).json({ message: 'Tenant company is inactive or not found' });
        return;
      }

      const enabledFeatures: string[] = JSON.parse(tenant.enabledFeatures || '[]');
      if (!enabledFeatures.includes(featureKey)) {
        res.status(403).json({ message: `Feature '${featureKey}' is not enabled for your company package` });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
