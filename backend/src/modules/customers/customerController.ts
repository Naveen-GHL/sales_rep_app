import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeCustomer(c: any) {
  return {
    id: c.id,
    companyId: c.companyId,
    name: c.name,
    phone: c.phone,
    email: c.email,
    status: c.status,
    assignedAgentId: c.assignedAgentId,
    assignedAgentName: c.assignedAgentName,
    location: c.location,
    lastContacted: c.lastContacted,
    openDealsCount: c.openDealsCount || 0,
    totalValue: c.totalValue || 0,
    createdAt: c.createdAt.toISOString ? c.createdAt.toISOString() : c.createdAt,
    notes: c.notes || '',
    customFields: typeof c.customFields === 'string' ? JSON.parse(c.customFields || '{}') : c.customFields || {},
  };
}

export async function getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const { status, assignedAgentId, search } = req.query;
    if (status) where.status = status as string;
    if (assignedAgentId) where.assignedAgentId = assignedAgentId as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { phone: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(customers.map(serializeCustomer));
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    if (!companyId) {
      res.status(403).json({ message: 'Company context required' });
      return;
    }

    const {
      name,
      phone,
      email,
      status = 'Active',
      assignedAgentId,
      assignedAgentName,
      location = '',
      lastContacted,
      notes = '',
      customFields = {},
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ message: 'Name and phone are required' });
      return;
    }

    const agentId = assignedAgentId || req.user?.id || 'unassigned';
    const agentName = assignedAgentName || req.user?.name || 'Unassigned';

    const customer = await prisma.customer.create({
      data: {
        companyId,
        name,
        phone,
        email: email || '',
        status,
        assignedAgentId: agentId,
        assignedAgentName: agentName,
        location,
        lastContacted: lastContacted || new Date().toISOString().split('T')[0],
        openDealsCount: 0,
        totalValue: 0,
        notes,
        customFields: JSON.stringify(customFields),
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_CUSTOMER',
        entityType: 'Customer',
        entityId: customer.id,
        companyId,
        details: `Created customer ${customer.name}`,
      });
    }

    res.status(201).json(serializeCustomer(customer));
  } catch (err) {
    next(err);
  }
}

export async function getCustomerById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && customer.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(serializeCustomer(customer));
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && existing.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const {
      name,
      phone,
      email,
      status,
      assignedAgentId,
      assignedAgentName,
      location,
      lastContacted,
      notes,
      customFields,
    } = req.body;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(status !== undefined && { status }),
        ...(assignedAgentId !== undefined && { assignedAgentId }),
        ...(assignedAgentName !== undefined && { assignedAgentName }),
        ...(location !== undefined && { location }),
        ...(lastContacted !== undefined && { lastContacted }),
        ...(notes !== undefined && { notes }),
        ...(customFields !== undefined && { customFields: JSON.stringify(customFields) }),
      },
    });

    res.json(serializeCustomer(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && existing.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await prisma.customer.delete({ where: { id } });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'DELETE_CUSTOMER',
        entityType: 'Customer',
        entityId: id,
        companyId: existing.companyId,
        details: `Deleted customer ${existing.name}`,
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getCustomerCalls(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }

    const calls = await prisma.callRecord.findMany({
      where: {
        companyId: customer.companyId,
        OR: [
          { contactPhone: customer.phone },
          { contactName: customer.name },
        ],
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json(calls);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerFollowups(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const followups = await prisma.followup.findMany({
      where: {
        contactId: id,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json(followups);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerDeals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const deals = await prisma.deal.findMany({
      where: {
        customerId: id,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(deals);
  } catch (err) {
    next(err);
  }
}
