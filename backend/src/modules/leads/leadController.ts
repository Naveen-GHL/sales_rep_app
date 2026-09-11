import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeLead(l: any) {
  return {
    id: l.id,
    companyId: l.companyId,
    name: l.name,
    phone: l.phone,
    email: l.email,
    location: l.location,
    source: l.source,
    status: l.status,
    priority: l.priority,
    assignedAgentId: l.assignedAgentId,
    assignedAgentName: l.assignedAgentName,
    nextFollowupDate: l.nextFollowupDate || undefined,
    createdAt: l.createdAt.toISOString ? l.createdAt.toISOString() : l.createdAt,
    notes: l.notes || '',
    customFields: typeof l.customFields === 'string' ? JSON.parse(l.customFields || '{}') : l.customFields || {},
  };
}

export async function getLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }

    const { status, priority, source, assignedAgentId, dateFrom, dateTo, scope } = req.query;

    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (source) where.source = source as string;

    // Scoping
    if (scope === 'mine' || req.user?.roleCode === 'sales_executive') {
      where.assignedAgentId = req.user?.id;
    } else if (assignedAgentId) {
      where.assignedAgentId = assignedAgentId as string;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) where.createdAt.lte = new Date(dateTo as string);
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(leads.map(serializeLead));
  } catch (err) {
    next(err);
  }
}

export async function createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
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
      location,
      source,
      status = 'New',
      priority = 'Medium',
      assignedAgentId,
      assignedAgentName,
      nextFollowupDate,
      notes = '',
      customFields = {},
    } = req.body;

    if (!name || !phone) {
      res.status(400).json({ message: 'Name and phone are required' });
      return;
    }

    const agentId = assignedAgentId || req.user?.id || 'unassigned';
    const agentName = assignedAgentName || req.user?.name || 'Unassigned';

    const lead = await prisma.lead.create({
      data: {
        companyId,
        name,
        phone,
        email: email || '',
        location: location || '',
        source: source || 'Direct Enquiry',
        status,
        priority,
        assignedAgentId: agentId,
        assignedAgentName: agentName,
        nextFollowupDate: nextFollowupDate || null,
        notes,
        customFields: JSON.stringify(customFields),
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_LEAD',
        entityType: 'Lead',
        entityId: lead.id,
        companyId,
        details: `Created lead ${lead.name}`,
      });
    }

    res.status(201).json(serializeLead(lead));
  } catch (err) {
    next(err);
  }
}

export async function getLeadById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const lead = await prisma.lead.findUnique({ where: { id } });

    if (!lead) {
      res.status(404).json({ message: 'Lead not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && lead.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(serializeLead(lead));
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Lead not found' });
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
      location,
      source,
      status,
      priority,
      assignedAgentId,
      assignedAgentName,
      nextFollowupDate,
      notes,
      customFields,
    } = req.body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(location !== undefined && { location }),
        ...(source !== undefined && { source }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(assignedAgentId !== undefined && { assignedAgentId }),
        ...(assignedAgentName !== undefined && { assignedAgentName }),
        ...(nextFollowupDate !== undefined && { nextFollowupDate }),
        ...(notes !== undefined && { notes }),
        ...(customFields !== undefined && { customFields: JSON.stringify(customFields) }),
      },
    });

    res.json(serializeLead(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Lead not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && existing.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await prisma.lead.delete({ where: { id } });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'DELETE_LEAD',
        entityType: 'Lead',
        entityId: id,
        companyId: existing.companyId,
        details: `Deleted lead ${existing.name}`,
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function assignLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { assignedAgentId } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ message: 'Lead not found' });
      return;
    }

    const agent = await prisma.user.findUnique({ where: { id: assignedAgentId } });
    if (!agent) {
      res.status(404).json({ message: 'Assigned agent user not found' });
      return;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        assignedAgentId: agent.id,
        assignedAgentName: agent.name,
      },
    });

    // Notify new agent
    await prisma.notificationItem.create({
      data: {
        userId: agent.id,
        companyId: lead.companyId,
        type: 'lead',
        title: 'New Lead Assigned',
        message: `${lead.name} has been assigned to you.`,
        link: `/leads`,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'ASSIGN_LEAD',
        entityType: 'Lead',
        entityId: lead.id,
        companyId: lead.companyId,
        details: `Reassigned lead ${lead.name} to ${agent.name}`,
      });
    }

    res.json(serializeLead(updated));
  } catch (err) {
    next(err);
  }
}

export async function convertLead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { createDeal, createSiteVisit, createConsultation } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      res.status(404).json({ message: 'Lead not found' });
      return;
    }

    // Transactional conversion
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark lead converted
      const updatedLead = await tx.lead.update({
        where: { id },
        data: { status: 'Converted' },
      });

      // 2. Create customer
      const customer = await tx.customer.create({
        data: {
          companyId: lead.companyId,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          status: 'Active',
          assignedAgentId: lead.assignedAgentId,
          assignedAgentName: lead.assignedAgentName,
          location: lead.location,
          lastContacted: new Date().toISOString().split('T')[0],
          openDealsCount: createDeal ? 1 : 0,
          totalValue: createDeal?.value ? parseFloat(createDeal.value) : 0,
          notes: lead.notes,
          customFields: lead.customFields,
        },
      });

      // 3. Optional Deal
      let deal = null;
      if (createDeal) {
        deal = await tx.deal.create({
          data: {
            companyId: lead.companyId,
            title: createDeal.title || `${lead.name} - Investment Opportunity`,
            customerId: customer.id,
            customerName: customer.name,
            stage: createDeal.stage || 'Proposal',
            value: createDeal.value ? parseFloat(createDeal.value) : 0,
            expectedCloseDate: createDeal.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            assignedAgentId: lead.assignedAgentId,
            assignedAgentName: lead.assignedAgentName,
            notes: createDeal.notes || '',
          },
        });
      }

      // 4. Optional Site Visit (Jamin)
      let siteVisit = null;
      if (createSiteVisit) {
        siteVisit = await tx.siteVisit.create({
          data: {
            companyId: lead.companyId,
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            projectId: createSiteVisit.projectId || 'proj-default',
            projectName: createSiteVisit.projectName || 'Default Project',
            plotNumber: createSiteVisit.plotNumber || null,
            scheduledAt: createSiteVisit.scheduledAt || new Date().toISOString(),
            assignedAgentId: lead.assignedAgentId,
            assignedAgentName: lead.assignedAgentName,
            status: 'Scheduled',
          },
        });
      }

      // 5. Optional Consultation (GHL)
      let consultation = null;
      if (createConsultation) {
        consultation = await tx.consultation.create({
          data: {
            companyId: lead.companyId,
            investorId: customer.id,
            investorName: customer.name,
            investorPhone: customer.phone,
            scheduledAt: createConsultation.scheduledAt || new Date().toISOString(),
            consultantId: lead.assignedAgentId,
            consultantName: lead.assignedAgentName,
            status: 'Scheduled',
            agenda: createConsultation.agenda || 'Wealth consultation',
          },
        });
      }

      return { updatedLead, customer, deal, siteVisit, consultation };
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CONVERT_LEAD',
        entityType: 'Lead',
        entityId: id,
        companyId: lead.companyId,
        details: `Converted lead ${lead.name} to Customer ${result.customer.id}`,
      });
    }

    res.json({
      lead: serializeLead(result.updatedLead),
      customer: {
        ...result.customer,
        customFields: JSON.parse(result.customer.customFields || '{}'),
      },
      deal: result.deal,
      siteVisit: result.siteVisit,
      consultation: result.consultation,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const leads = await prisma.lead.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['ID', 'Name', 'Phone', 'Email', 'Location', 'Source', 'Status', 'Priority', 'Agent Name', 'Created At'];
    const rows = leads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.location}"`,
      `"${l.source}"`,
      l.status,
      l.priority,
      `"${l.assignedAgentName}"`,
      l.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads_export.csv"');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
}
