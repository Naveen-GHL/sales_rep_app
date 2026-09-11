import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export function serializeJob(j: any) {
  return {
    id: j.id,
    type: j.type,
    status: j.status,
    initiatedBy: j.initiatedBy,
    resultSummary: typeof j.resultSummary === 'string' ? JSON.parse(j.resultSummary || '{}') : j.resultSummary,
    errorReportUrl: j.errorReportUrl || undefined,
    createdAt: j.createdAt.toISOString ? j.createdAt.toISOString() : j.createdAt,
  };
}

export async function getJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { type, status } = req.query;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (type) where.type = type as string;
    if (status) where.status = status as string;

    const jobs = await prisma.jobRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobs.map(serializeJob));
  } catch (err) {
    next(err);
  }
}

export async function getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const job = await prisma.jobRecord.findUnique({ where: { id } });
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.json(serializeJob(job));
  } catch (err) {
    next(err);
  }
}
