import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export function serializeAuditLog(a: any) {
  return {
    id: a.id,
    timestamp: a.timestamp.toISOString ? a.timestamp.toISOString() : a.timestamp,
    actorName: a.actorName,
    actorEmail: a.actorEmail,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId,
    companyId: a.companyId || undefined,
    companyName: a.companyName || undefined,
    details: a.details || '',
  };
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const where: any = {};
    if (req.user?.roleCode === 'super_admin') {
      const companyId = req.query.companyId as string;
      if (companyId) where.companyId = companyId;
    } else {
      where.companyId = req.user?.companyId;
    }

    const { actor, action, entityType } = req.query;
    if (actor) where.actorEmail = { contains: actor as string };
    if (action) where.action = action as string;
    if (entityType) where.entityType = entityType as string;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json(logs.map(serializeAuditLog));
  } catch (err) {
    next(err);
  }
}
