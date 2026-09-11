import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { PIPELINE_STAGES } from '../../config/constants';
import { logAudit } from '../../middleware/audit';

export function serializeDeal(d: any) {
  return {
    id: d.id,
    companyId: d.companyId,
    title: d.title,
    customerId: d.customerId,
    customerName: d.customerName,
    stage: d.stage,
    value: d.value,
    expectedCloseDate: d.expectedCloseDate,
    assignedAgentId: d.assignedAgentId,
    assignedAgentName: d.assignedAgentName,
    notes: d.notes || '',
    lostReason: d.lostReason || undefined,
    createdAt: d.createdAt.toISOString ? d.createdAt.toISOString() : d.createdAt,
  };
}

export async function getDeals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { stage, assignedAgentId, customerId } = req.query;
    if (stage) where.stage = stage as string;
    if (assignedAgentId) where.assignedAgentId = assignedAgentId as string;
    if (customerId) where.customerId = customerId as string;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(deals.map(serializeDeal));
  } catch (err) {
    next(err);
  }
}

export async function getPipeline(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const deals = await prisma.deal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Group deals by stage
    const grouped: Record<string, any[]> = {};
    for (const d of deals) {
      if (!grouped[d.stage]) {
        grouped[d.stage] = [];
      }
      grouped[d.stage].push(serializeDeal(d));
    }

    res.json(grouped);
  } catch (err) {
    next(err);
  }
}

export async function createDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ message: 'Company context required' });
      return;
    }

    const {
      title,
      customerId,
      customerName,
      stage = 'Qualified',
      value = 0,
      expectedCloseDate,
      assignedAgentId,
      assignedAgentName,
      notes = '',
    } = req.body;

    if (!title || !customerId) {
      res.status(400).json({ message: 'Title and customerId are required' });
      return;
    }

    const deal = await prisma.deal.create({
      data: {
        companyId,
        title,
        customerId,
        customerName: customerName || 'Customer',
        stage,
        value: typeof value === 'string' ? parseFloat(value) : value,
        expectedCloseDate: expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        assignedAgentId: assignedAgentId || req.user?.id || 'unassigned',
        assignedAgentName: assignedAgentName || req.user?.name || 'Unassigned',
        notes,
      },
    });

    // Update customer's openDealsCount and totalValue
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        openDealsCount: { increment: 1 },
        totalValue: { increment: deal.value },
      },
    }).catch(() => {});

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_DEAL',
        entityType: 'Deal',
        entityId: deal.id,
        companyId,
        details: `Created deal ${deal.title} for ${deal.customerName}`,
      });
    }

    res.status(201).json(serializeDeal(deal));
  } catch (err) {
    next(err);
  }
}

export async function getDealById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deal = await prisma.deal.findUnique({ where: { id } });

    if (!deal) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && deal.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(serializeDeal(deal));
  } catch (err) {
    next(err);
  }
}

export async function updateDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && existing.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const {
      title,
      stage,
      value,
      expectedCloseDate,
      assignedAgentId,
      assignedAgentName,
      notes,
      lostReason,
    } = req.body;

    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(stage !== undefined && { stage }),
        ...(value !== undefined && { value: typeof value === 'string' ? parseFloat(value) : value }),
        ...(expectedCloseDate !== undefined && { expectedCloseDate }),
        ...(assignedAgentId !== undefined && { assignedAgentId }),
        ...(assignedAgentName !== undefined && { assignedAgentName }),
        ...(notes !== undefined && { notes }),
        ...(lostReason !== undefined && { lostReason }),
      },
    });

    res.json(serializeDeal(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteDeal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.deal.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Deal not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && existing.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await prisma.deal.delete({ where: { id } });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'DELETE_DEAL',
        entityType: 'Deal',
        entityId: id,
        companyId: existing.companyId,
        details: `Deleted deal ${existing.title}`,
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function updateStage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      res.status(400).json({ message: 'Stage is required' });
      return;
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: { stage },
    });

    res.json(serializeDeal(updated));
  } catch (err) {
    next(err);
  }
}

export async function markWon(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.deal.update({
      where: { id },
      data: { stage: 'Won' },
    });
    res.json(serializeDeal(updated));
  } catch (err) {
    next(err);
  }
}

export async function markLost(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { lostReason } = req.body;

    if (!lostReason) {
      res.status(400).json({ message: 'Lost reason is required when marking deal lost' });
      return;
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: { stage: 'Lost', lostReason },
    });
    res.json(serializeDeal(updated));
  } catch (err) {
    next(err);
  }
}
