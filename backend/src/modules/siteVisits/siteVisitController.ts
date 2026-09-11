import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeSiteVisit(sv: any) {
  return {
    id: sv.id,
    companyId: sv.companyId,
    customerId: sv.customerId,
    customerName: sv.customerName,
    customerPhone: sv.customerPhone,
    projectId: sv.projectId,
    projectName: sv.projectName,
    plotNumber: sv.plotNumber || undefined,
    scheduledAt: sv.scheduledAt,
    assignedAgentId: sv.assignedAgentId,
    assignedAgentName: sv.assignedAgentName,
    status: sv.status,
    outcomeNotes: sv.outcomeNotes || undefined,
  };
}

export async function getSiteVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { status, assignedAgentId } = req.query;
    if (status) where.status = status as string;
    if (assignedAgentId) where.assignedAgentId = assignedAgentId as string;

    const visits = await prisma.siteVisit.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(visits.map(serializeSiteVisit));
  } catch (err) {
    next(err);
  }
}

export async function createSiteVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'jamin';
    const {
      customerId,
      customerName,
      customerPhone,
      projectId,
      projectName,
      plotNumber,
      scheduledAt,
      assignedAgentId,
      assignedAgentName,
      status = 'Scheduled',
      outcomeNotes,
    } = req.body;

    if (!customerId || !projectId || !scheduledAt) {
      res.status(400).json({ message: 'customerId, projectId, and scheduledAt are required' });
      return;
    }

    const visit = await prisma.siteVisit.create({
      data: {
        companyId,
        customerId,
        customerName: customerName || 'Customer',
        customerPhone: customerPhone || '',
        projectId,
        projectName: projectName || 'Project',
        plotNumber: plotNumber || null,
        scheduledAt,
        assignedAgentId: assignedAgentId || req.user?.id || 'unassigned',
        assignedAgentName: assignedAgentName || req.user?.name || 'Unassigned',
        status,
        outcomeNotes: outcomeNotes || null,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'SCHEDULE_SITE_VISIT',
        entityType: 'SiteVisit',
        entityId: visit.id,
        companyId,
        details: `Scheduled site visit for ${visit.customerName} at ${visit.projectName}`,
      });
    }

    res.status(201).json(serializeSiteVisit(visit));
  } catch (err) {
    next(err);
  }
}

export async function getSiteVisitById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const visit = await prisma.siteVisit.findUnique({ where: { id } });
    if (!visit) {
      res.status(404).json({ message: 'Site visit not found' });
      return;
    }
    res.json(serializeSiteVisit(visit));
  } catch (err) {
    next(err);
  }
}

export async function updateSiteVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { plotNumber, scheduledAt, status, outcomeNotes, assignedAgentId, assignedAgentName } = req.body;

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        ...(plotNumber !== undefined && { plotNumber }),
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(status !== undefined && { status }),
        ...(outcomeNotes !== undefined && { outcomeNotes }),
        ...(assignedAgentId !== undefined && { assignedAgentId }),
        ...(assignedAgentName !== undefined && { assignedAgentName }),
      },
    });

    res.json(serializeSiteVisit(updated));
  } catch (err) {
    next(err);
  }
}

export async function completeSiteVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { outcomeNotes } = req.body;

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'Completed',
        ...(outcomeNotes && { outcomeNotes }),
      },
    });

    res.json(serializeSiteVisit(updated));
  } catch (err) {
    next(err);
  }
}

export async function rescheduleSiteVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      res.status(400).json({ message: 'scheduledAt is required' });
      return;
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        scheduledAt,
        status: 'Rescheduled',
      },
    });

    res.json(serializeSiteVisit(updated));
  } catch (err) {
    next(err);
  }
}
