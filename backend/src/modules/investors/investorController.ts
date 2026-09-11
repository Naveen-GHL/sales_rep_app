import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeInvestor(inv: any) {
  return {
    id: inv.id,
    companyId: inv.companyId,
    name: inv.name,
    phone: inv.phone,
    email: inv.email,
    status: inv.status,
    investmentCapacity: inv.investmentCapacity,
    preferredAssetClass: inv.preferredAssetClass,
    assignedAgentId: inv.assignedAgentId,
    assignedAgentName: inv.assignedAgentName,
    referralSource: inv.referralSource || undefined,
    createdAt: inv.createdAt.toISOString ? inv.createdAt.toISOString() : inv.createdAt,
    notes: inv.notes || '',
  };
}

export async function getInvestors(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { status, assignedAgentId } = req.query;
    if (status) where.status = status as string;
    if (assignedAgentId) where.assignedAgentId = assignedAgentId as string;

    const investors = await prisma.investor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(investors.map(serializeInvestor));
  } catch (err) {
    next(err);
  }
}

export async function createInvestor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'ghl';
    const {
      name,
      phone,
      email,
      status = 'Lead',
      investmentCapacity,
      preferredAssetClass,
      assignedAgentId,
      assignedAgentName,
      referralSource,
      notes = '',
    } = req.body;

    if (!name || !phone || !investmentCapacity) {
      res.status(400).json({ message: 'Name, phone, and investmentCapacity are required' });
      return;
    }

    const investor = await prisma.investor.create({
      data: {
        companyId,
        name,
        phone,
        email: email || '',
        status,
        investmentCapacity,
        preferredAssetClass: preferredAssetClass || 'Commercial Real Estate',
        assignedAgentId: assignedAgentId || req.user?.id || 'unassigned',
        assignedAgentName: assignedAgentName || req.user?.name || 'Unassigned',
        referralSource: referralSource || null,
        notes,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_INVESTOR',
        entityType: 'Investor',
        entityId: investor.id,
        companyId,
        details: `Created investor ${investor.name}`,
      });
    }

    res.status(201).json(serializeInvestor(investor));
  } catch (err) {
    next(err);
  }
}

export async function getInvestorById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const investor = await prisma.investor.findUnique({ where: { id } });
    if (!investor) {
      res.status(404).json({ message: 'Investor not found' });
      return;
    }
    res.json(serializeInvestor(investor));
  } catch (err) {
    next(err);
  }
}

export async function updateInvestor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, phone, email, status, investmentCapacity, preferredAssetClass, notes } = req.body;

    const updated = await prisma.investor.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(status !== undefined && { status }),
        ...(investmentCapacity !== undefined && { investmentCapacity }),
        ...(preferredAssetClass !== undefined && { preferredAssetClass }),
        ...(notes !== undefined && { notes }),
      },
    });

    res.json(serializeInvestor(updated));
  } catch (err) {
    next(err);
  }
}
