import { prisma } from '../prisma';

export interface AuditParams {
  actorName: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  companyId?: string | null;
  companyName?: string | null;
  details?: string;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorName: params.actorName,
        actorEmail: params.actorEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        companyId: params.companyId || null,
        companyName: params.companyName || null,
        details: params.details || '',
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
