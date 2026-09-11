import { Request, Response, NextFunction } from 'express';

export function requirePermission(permissionKey: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user.roleCode === 'super_admin') {
      next();
      return;
    }

    if (!req.user.permissions || !req.user.permissions.includes(permissionKey)) {
      res.status(403).json({ message: `Forbidden: Missing required permission '${permissionKey}'` });
      return;
    }

    next();
  };
}
