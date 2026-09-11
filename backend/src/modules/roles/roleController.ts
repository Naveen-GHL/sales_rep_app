import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { PERMISSIONS, FEATURES } from '../../config/constants';
import { logAudit } from '../../middleware/audit';

export async function getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await prisma.role.findMany();
    const result = roles.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      permissions: JSON.parse(r.permissions || '[]'),
    }));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ message: 'Permissions must be an array of string keys' });
      return;
    }

    const updated = await prisma.role.update({
      where: { code },
      data: {
        permissions: JSON.stringify(permissions),
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'UPDATE_ROLE_PERMISSIONS',
        entityType: 'Role',
        entityId: updated.id,
        details: `Updated permissions for role ${code}`,
      });
    }

    res.json({
      id: updated.id,
      name: updated.name,
      code: updated.code,
      permissions: JSON.parse(updated.permissions || '[]'),
    });
  } catch (err) {
    next(err);
  }
}

export function getPermissionsList(_req: Request, res: Response): void {
  res.json(Object.values(PERMISSIONS));
}

export function getFeaturesList(_req: Request, res: Response): void {
  res.json(Object.values(FEATURES));
}
