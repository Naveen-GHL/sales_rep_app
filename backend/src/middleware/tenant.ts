import { Request, Response, NextFunction } from 'express';

export function resolveTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  // Super Admin can operate across tenants or target a specific company if provided in query/header
  if (req.user.roleCode === 'super_admin') {
    const targetCompanyId = (req.query.companyId as string) || (req.headers['x-company-id'] as string) || req.user.companyId;
    if (targetCompanyId) {
      req.companyId = targetCompanyId;
    }
    next();
    return;
  }

  // Regular company users MUST belong to a company
  if (!req.user.companyId) {
    res.status(403).json({ message: 'User does not belong to any tenant company' });
    return;
  }

  req.companyId = req.user.companyId;
  req.companySlug = req.user.companySlug || undefined;
  next();
}
