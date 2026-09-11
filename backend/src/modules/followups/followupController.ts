import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeFollowup(f: any) {
  return {
    id: f.id,
    companyId: f.companyId,
    contactId: f.contactId,
    contactName: f.contactName,
    contactPhone: f.contactPhone,
    contactType: f.contactType,
    scheduledAt: f.scheduledAt,
    priority: f.priority,
    status: f.status,
    notes: f.notes || '',
    assignedAgentId: f.assignedAgentId,
    assignedAgentName: f.assignedAgentName,
  };
}

export async function getFollowups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { status, contactType, assignedAgentId } = req.query;
    if (status) where.status = status as string;
    if (contactType) where.contactType = contactType as string;
    if (req.user?.roleCode === 'sales_executive') {
      where.assignedAgentId = req.user?.id;
    } else if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId as string;
    }

    const followups = await prisma.followup.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(followups.map(serializeFollowup));
  } catch (err) {
    next(err);
  }
}

export async function createFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ message: 'Company context required' });
      return;
    }

    const {
      contactId,
      contactName,
      contactPhone,
      contactType = 'lead',
      scheduledAt,
      priority = 'Medium',
      status = 'Pending',
      notes = '',
      assignedAgentId,
      assignedAgentName,
    } = req.body;

    if (!contactId || !scheduledAt) {
      res.status(400).json({ message: 'ContactId and scheduledAt are required' });
      return;
    }

    const followup = await prisma.followup.create({
      data: {
        companyId,
        contactId,
        contactName: contactName || 'Contact',
        contactPhone: contactPhone || '',
        contactType,
        scheduledAt,
        priority,
        status,
        notes,
        assignedAgentId: assignedAgentId || req.user?.id || 'unassigned',
        assignedAgentName: assignedAgentName || req.user?.name || 'Unassigned',
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_FOLLOWUP',
        entityType: 'Followup',
        entityId: followup.id,
        companyId,
        details: `Scheduled follow-up with ${followup.contactName} at ${followup.scheduledAt}`,
      });
    }

    res.status(201).json(serializeFollowup(followup));
  } catch (err) {
    next(err);
  }
}

export async function updateFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { scheduledAt, priority, status, notes } = req.body;

    const updated = await prisma.followup.update({
      where: { id },
      data: {
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(serializeFollowup(updated));
  } catch (err) {
    next(err);
  }
}

export async function completeFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.followup.update({
      where: { id },
      data: { status: 'Completed' },
    });
    res.json(serializeFollowup(updated));
  } catch (err) {
    next(err);
  }
}

export async function cancelFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.followup.update({
      where: { id },
      data: { status: 'Cancelled' },
    });
    res.json(serializeFollowup(updated));
  } catch (err) {
    next(err);
  }
}

export async function rescheduleFollowup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { scheduledAt } = req.body;

    if (!scheduledAt) {
      res.status(400).json({ message: 'scheduledAt is required' });
      return;
    }

    const updated = await prisma.followup.update({
      where: { id },
      data: { scheduledAt, status: 'Pending' },
    });

    res.json(serializeFollowup(updated));
  } catch (err) {
    next(err);
  }
}
