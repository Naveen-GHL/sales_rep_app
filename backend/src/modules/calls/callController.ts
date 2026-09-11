import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeCall(c: any) {
  return {
    id: c.id,
    companyId: c.companyId,
    contactName: c.contactName,
    contactPhone: c.contactPhone,
    direction: c.direction,
    duration: c.duration,
    agentId: c.agentId,
    agentName: c.agentName,
    disposition: c.disposition,
    timestamp: c.timestamp.toISOString ? c.timestamp.toISOString() : c.timestamp,
    recordingUrl: c.recordingUrl || undefined,
    transcription: c.transcription || undefined,
    notes: c.notes || undefined,
  };
}

export async function getAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const avail = await prisma.agentAvailability.findUnique({
      where: { userId },
    });

    res.json({
      status: avail?.status || 'available',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const companyId = req.companyId || req.user?.companyId || 'platform';
    const { status } = req.body;

    if (!['available', 'busy', 'offline'].includes(status)) {
      res.status(400).json({ message: 'Status must be available, busy, or offline' });
      return;
    }

    const updated = await prisma.agentAvailability.upsert({
      where: { userId },
      update: { status, companyId },
      create: { userId, companyId, status },
    });

    res.json({ status: updated.status });
  } catch (err) {
    next(err);
  }
}

export async function incomingCallWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { callerPhone, companyId } = req.body;
    const targetCompanyId = companyId || req.companyId;

    let matchedContact: any = null;
    let contactType = 'Unknown';

    if (callerPhone) {
      // 1. Check Leads
      const lead = await prisma.lead.findFirst({
        where: {
          phone: { contains: callerPhone },
          ...(targetCompanyId ? { companyId: targetCompanyId } : {}),
        },
      });

      if (lead) {
        matchedContact = lead;
        contactType = 'Lead';
      } else {
        // 2. Check Customers
        const customer = await prisma.customer.findFirst({
          where: {
            phone: { contains: callerPhone },
            ...(targetCompanyId ? { companyId: targetCompanyId } : {}),
          },
        });
        if (customer) {
          matchedContact = customer;
          contactType = 'Customer';
        }
      }
    }

    res.json({
      callerPhone,
      matched: !!matchedContact,
      contactType,
      contact: matchedContact,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCalls(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { direction, agentId, disposition, dateFrom, dateTo } = req.query;
    if (direction) where.direction = direction as string;
    if (disposition) where.disposition = disposition as string;

    if (req.user?.roleCode === 'sales_executive') {
      where.agentId = req.user?.id;
    } else if (agentId) {
      where.agentId = agentId as string;
    }

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom as string);
      if (dateTo) where.timestamp.lte = new Date(dateTo as string);
    }

    const calls = await prisma.callRecord.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    res.json(calls.map(serializeCall));
  } catch (err) {
    next(err);
  }
}

export async function createCall(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ message: 'Company context required' });
      return;
    }

    const {
      contactName,
      contactPhone,
      direction = 'outbound',
      duration = 0,
      agentId,
      agentName,
      disposition,
      recordingUrl,
      transcription,
      notes,
    } = req.body;

    if (!contactPhone || !disposition) {
      res.status(400).json({ message: 'contactPhone and disposition are required to log a call' });
      return;
    }

    const call = await prisma.callRecord.create({
      data: {
        companyId,
        contactName: contactName || 'Contact',
        contactPhone,
        direction,
        duration: typeof duration === 'string' ? parseInt(duration, 10) : duration,
        agentId: agentId || req.user?.id || 'unassigned',
        agentName: agentName || req.user?.name || 'Unassigned',
        disposition,
        recordingUrl: recordingUrl || null,
        transcription: transcription || null,
        notes: notes || null,
      },
    });

    // Update customer's lastContacted date if matched
    await prisma.customer.updateMany({
      where: {
        companyId,
        OR: [{ phone: contactPhone }, { name: contactName }],
      },
      data: {
        lastContacted: new Date().toISOString().split('T')[0],
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'LOG_CALL',
        entityType: 'CallRecord',
        entityId: call.id,
        companyId,
        details: `Logged ${direction} call to ${call.contactName} (${disposition})`,
      });
    }

    res.status(201).json(serializeCall(call));
  } catch (err) {
    next(err);
  }
}

export async function getCallById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const call = await prisma.callRecord.findUnique({ where: { id } });

    if (!call) {
      res.status(404).json({ message: 'Call record not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && call.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(serializeCall(call));
  } catch (err) {
    next(err);
  }
}

export async function getRecording(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const call = await prisma.callRecord.findUnique({ where: { id } });

    if (!call) {
      res.status(404).json({ message: 'Call record not found' });
      return;
    }

    res.json({
      callId: call.id,
      recordingUrl: call.recordingUrl || 'https://actions.google.com/sounds/v1/telecom/phone_dialing.ogg',
    });
  } catch (err) {
    next(err);
  }
}
