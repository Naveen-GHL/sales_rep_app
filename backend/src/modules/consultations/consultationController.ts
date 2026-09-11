import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeConsultation(c: any) {
  return {
    id: c.id,
    companyId: c.companyId,
    investorId: c.investorId,
    investorName: c.investorName,
    investorPhone: c.investorPhone,
    scheduledAt: c.scheduledAt,
    consultantId: c.consultantId,
    consultantName: c.consultantName,
    status: c.status,
    agenda: c.agenda || '',
    outcomeNotes: c.outcomeNotes || undefined,
  };
}

export async function getConsultations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { investorId, status } = req.query;
    if (investorId) where.investorId = investorId as string;
    if (status) where.status = status as string;

    const list = await prisma.consultation.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(list.map(serializeConsultation));
  } catch (err) {
    next(err);
  }
}

export async function createConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'ghl';
    const {
      investorId,
      investorName,
      investorPhone,
      scheduledAt,
      consultantId,
      consultantName,
      agenda = '',
      status = 'Scheduled',
    } = req.body;

    if (!investorId || !scheduledAt) {
      res.status(400).json({ message: 'investorId and scheduledAt are required' });
      return;
    }

    const item = await prisma.consultation.create({
      data: {
        companyId,
        investorId,
        investorName: investorName || 'Investor',
        investorPhone: investorPhone || '',
        scheduledAt,
        consultantId: consultantId || req.user?.id || 'unassigned',
        consultantName: consultantName || req.user?.name || 'Unassigned',
        status,
        agenda,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'SCHEDULE_CONSULTATION',
        entityType: 'Consultation',
        entityId: item.id,
        companyId,
        details: `Scheduled consultation for ${item.investorName} at ${item.scheduledAt}`,
      });
    }

    res.status(201).json(serializeConsultation(item));
  } catch (err) {
    next(err);
  }
}

export async function getConsultationById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const item = await prisma.consultation.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ message: 'Consultation not found' });
      return;
    }
    res.json(serializeConsultation(item));
  } catch (err) {
    next(err);
  }
}

export async function updateConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { scheduledAt, status, agenda, outcomeNotes } = req.body;

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        ...(scheduledAt !== undefined && { scheduledAt }),
        ...(status !== undefined && { status }),
        ...(agenda !== undefined && { agenda }),
        ...(outcomeNotes !== undefined && { outcomeNotes }),
      },
    });

    res.json(serializeConsultation(updated));
  } catch (err) {
    next(err);
  }
}

export async function completeConsultation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { outcomeNotes } = req.body;

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        status: 'Completed',
        ...(outcomeNotes && { outcomeNotes }),
      },
    });

    res.json(serializeConsultation(updated));
  } catch (err) {
    next(err);
  }
}
