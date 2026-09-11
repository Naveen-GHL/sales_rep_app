import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeOpportunity(op: any) {
  return {
    id: op.id,
    companyId: op.companyId,
    title: op.title,
    investorId: op.investorId,
    investorName: op.investorName,
    stage: op.stage,
    targetAmount: op.targetAmount,
    committedAmount: op.committedAmount,
    assignedAgentId: op.assignedAgentId,
    assignedAgentName: op.assignedAgentName,
    expectedCloseDate: op.expectedCloseDate,
    notes: op.notes || '',
  };
}

export async function getOpportunities(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { stage, investorId } = req.query;
    if (stage) where.stage = stage as string;
    if (investorId) where.investorId = investorId as string;

    const list = await prisma.investmentOpportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(list.map(serializeOpportunity));
  } catch (err) {
    next(err);
  }
}

export async function createOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'ghl';
    const {
      title,
      investorId,
      investorName,
      stage = 'Enquiry',
      targetAmount = 0,
      committedAmount = 0,
      assignedAgentId,
      assignedAgentName,
      expectedCloseDate,
      notes = '',
    } = req.body;

    if (!title || !investorId) {
      res.status(400).json({ message: 'title and investorId are required' });
      return;
    }

    const item = await prisma.investmentOpportunity.create({
      data: {
        companyId,
        title,
        investorId,
        investorName: investorName || 'Investor',
        stage,
        targetAmount: typeof targetAmount === 'string' ? parseFloat(targetAmount) : targetAmount,
        committedAmount: typeof committedAmount === 'string' ? parseFloat(committedAmount) : committedAmount,
        assignedAgentId: assignedAgentId || req.user?.id || 'unassigned',
        assignedAgentName: assignedAgentName || req.user?.name || 'Unassigned',
        expectedCloseDate: expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_OPPORTUNITY',
        entityType: 'InvestmentOpportunity',
        entityId: item.id,
        companyId,
        details: `Created opportunity ${item.title} for ${item.investorName}`,
      });
    }

    res.status(201).json(serializeOpportunity(item));
  } catch (err) {
    next(err);
  }
}

export async function getOpportunityById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const item = await prisma.investmentOpportunity.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ message: 'Opportunity not found' });
      return;
    }
    res.json(serializeOpportunity(item));
  } catch (err) {
    next(err);
  }
}

export async function updateOpportunity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { title, stage, targetAmount, committedAmount, expectedCloseDate, notes } = req.body;

    const updated = await prisma.investmentOpportunity.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(stage !== undefined && { stage }),
        ...(targetAmount !== undefined && { targetAmount: typeof targetAmount === 'string' ? parseFloat(targetAmount) : targetAmount }),
        ...(committedAmount !== undefined && { committedAmount: typeof committedAmount === 'string' ? parseFloat(committedAmount) : committedAmount }),
        ...(expectedCloseDate !== undefined && { expectedCloseDate }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(serializeOpportunity(updated));
  } catch (err) {
    next(err);
  }
}

export async function updateOpportunityStage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage) {
      res.status(400).json({ message: 'stage is required' });
      return;
    }

    const updated = await prisma.investmentOpportunity.update({
      where: { id },
      data: { stage },
    });

    res.json(serializeOpportunity(updated));
  } catch (err) {
    next(err);
  }
}
