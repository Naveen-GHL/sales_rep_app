import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export async function getLeadReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const leads = await prisma.lead.findMany({
      where: companyId ? { companyId } : {},
    });

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      byPriority[l.priority] = (byPriority[l.priority] || 0) + 1;
      bySource[l.source] = (bySource[l.source] || 0) + 1;
    }

    res.json({
      totalLeads: leads.length,
      byStatus,
      byPriority,
      bySource,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCallReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const calls = await prisma.callRecord.findMany({
      where: companyId ? { companyId } : {},
    });

    const byDisposition: Record<string, number> = {};
    let totalDuration = 0;
    let inbound = 0;
    let outbound = 0;

    for (const c of calls) {
      byDisposition[c.disposition] = (byDisposition[c.disposition] || 0) + 1;
      totalDuration += c.duration;
      if (c.direction === 'inbound') inbound++;
      else outbound++;
    }

    res.json({
      totalCalls: calls.length,
      inbound,
      outbound,
      avgDuration: calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
      totalDuration,
      byDisposition,
    });
  } catch (err) {
    next(err);
  }
}

export async function getFollowupReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const followups = await prisma.followup.findMany({
      where: companyId ? { companyId } : {},
    });

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const f of followups) {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
      byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
    }

    res.json({
      totalFollowups: followups.length,
      byStatus,
      byPriority,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversionReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const leads = await prisma.lead.findMany({ where: companyId ? { companyId } : {} });
    const customers = await prisma.customer.findMany({ where: companyId ? { companyId } : {} });
    const deals = await prisma.deal.findMany({ where: companyId ? { companyId } : {} });

    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

    const wonDeals = deals.filter((d) => d.stage === 'Won' || d.stage === 'Closed Won').length;
    const totalDealValue = deals.reduce((acc, d) => acc + d.value, 0);

    res.json({
      totalLeads,
      convertedLeads,
      conversionRate: `${conversionRate}%`,
      totalCustomers: customers.length,
      totalDeals: deals.length,
      wonDeals,
      totalDealValue,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAgentPerformanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const users = await prisma.user.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        roleCode: { in: ['sales_executive', 'sales_manager'] },
      },
    });

    const performance = await Promise.all(
      users.map(async (u) => {
        const leadCount = await prisma.lead.count({ where: { assignedAgentId: u.id } });
        const convertedCount = await prisma.lead.count({ where: { assignedAgentId: u.id, status: 'Converted' } });
        const callCount = await prisma.callRecord.count({ where: { agentId: u.id } });
        const deals = await prisma.deal.findMany({ where: { assignedAgentId: u.id } });
        const wonDeals = deals.filter((d) => d.stage === 'Won' || d.stage === 'Closed Won');
        const closedVolume = wonDeals.reduce((sum, d) => sum + d.value, 0);

        return {
          agentId: u.id,
          agentName: u.name,
          email: u.email,
          totalLeads: leadCount,
          convertedLeads: convertedCount,
          conversionRate: leadCount > 0 ? `${((convertedCount / leadCount) * 100).toFixed(1)}%` : '0%',
          totalCalls: callCount,
          totalDeals: deals.length,
          wonDeals: wonDeals.length,
          closedVolume,
        };
      })
    );

    res.json(performance);
  } catch (err) {
    next(err);
  }
}

export async function getLeadSourcesReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const leads = await prisma.lead.findMany({
      where: companyId ? { companyId } : {},
    });

    const sources: Record<string, { count: number; converted: number }> = {};
    for (const l of leads) {
      if (!sources[l.source]) {
        sources[l.source] = { count: 0, converted: 0 };
      }
      sources[l.source].count++;
      if (l.status === 'Converted') {
        sources[l.source].converted++;
      }
    }

    res.json(sources);
  } catch (err) {
    next(err);
  }
}

export async function getDealsReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const deals = await prisma.deal.findMany({
      where: companyId ? { companyId } : {},
    });

    const byStage: Record<string, { count: number; value: number }> = {};
    for (const d of deals) {
      if (!byStage[d.stage]) {
        byStage[d.stage] = { count: 0, value: 0 };
      }
      byStage[d.stage].count++;
      byStage[d.stage].value += d.value;
    }

    res.json({
      totalDeals: deals.length,
      totalPipelineValue: deals.reduce((acc, d) => acc + d.value, 0),
      byStage,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { type } = req.params;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report.csv"`);
    res.send(`Report Type,Export Date\n"${type}","${new Date().toISOString()}"\n`);
  } catch (err) {
    next(err);
  }
}
