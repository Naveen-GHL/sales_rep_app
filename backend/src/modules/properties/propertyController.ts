import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';

export function serializeProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    location: p.location,
    status: p.status,
    totalPlots: p.totalPlots || 0,
    availablePlots: p.availablePlots || 0,
    holdPlots: p.holdPlots || 0,
    soldPlots: p.soldPlots || 0,
    description: p.description || '',
    priceRange: p.priceRange || '',
  };
}

export function serializePlot(pl: any) {
  return {
    id: pl.id,
    projectId: pl.projectId,
    projectName: pl.projectName,
    plotNumber: pl.plotNumber,
    sizeSqft: pl.sizeSqft,
    pricePerSqft: pl.pricePerSqft,
    totalPrice: pl.totalPrice,
    status: pl.status,
    dimension: pl.dimension || undefined,
    facing: pl.facing || undefined,
    holdByCustomer: pl.holdByCustomer || undefined,
    holdByAgent: pl.holdByAgent || undefined,
    holdExpiry: pl.holdExpiry ? pl.holdExpiry.toISOString() : undefined,
  };
}

export async function getProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const projects = await prisma.propertyProject.findMany({
      where: companyId ? { companyId } : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects.map(serializeProject));
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'jamin';
    const { name, location, status = 'Active', description = '', priceRange = '' } = req.body;

    if (!name || !location) {
      res.status(400).json({ message: 'Project name and location are required' });
      return;
    }

    const project = await prisma.propertyProject.create({
      data: {
        companyId,
        name,
        location,
        status,
        description,
        priceRange,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_PROJECT',
        entityType: 'PropertyProject',
        entityId: project.id,
        companyId,
        details: `Created project ${project.name}`,
      });
    }

    res.status(201).json(serializeProject(project));
  } catch (err) {
    next(err);
  }
}

export async function getProjectById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const project = await prisma.propertyProject.findUnique({ where: { id } });
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    res.json(serializeProject(project));
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, location, status, description, priceRange } = req.body;

    const updated = await prisma.propertyProject.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(status !== undefined && { status }),
        ...(description !== undefined && { description }),
        ...(priceRange !== undefined && { priceRange }),
      },
    });

    res.json(serializeProject(updated));
  } catch (err) {
    next(err);
  }
}

export async function getProjectPlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const plots = await prisma.plot.findMany({
      where: { projectId: id },
      orderBy: { plotNumber: 'asc' },
    });
    res.json(plots.map(serializePlot));
  } catch (err) {
    next(err);
  }
}

export async function getPlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const where: any = {};
    if (companyId) where.companyId = companyId;

    const { projectId, status } = req.query;
    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as string;

    const plots = await prisma.plot.findMany({
      where,
      orderBy: { plotNumber: 'asc' },
    });

    res.json(plots.map(serializePlot));
  } catch (err) {
    next(err);
  }
}

export async function createPlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId || 'jamin';
    const {
      projectId,
      projectName,
      plotNumber,
      sizeSqft,
      pricePerSqft,
      status = 'Available',
      dimension,
      facing,
    } = req.body;

    if (!projectId || !plotNumber || !sizeSqft || !pricePerSqft) {
      res.status(400).json({ message: 'projectId, plotNumber, sizeSqft, and pricePerSqft are required' });
      return;
    }

    const sSqft = typeof sizeSqft === 'string' ? parseFloat(sizeSqft) : sizeSqft;
    const pSqft = typeof pricePerSqft === 'string' ? parseFloat(pricePerSqft) : pricePerSqft;
    const totalPrice = sSqft * pSqft;

    const plot = await prisma.plot.create({
      data: {
        companyId,
        projectId,
        projectName: projectName || 'Project',
        plotNumber,
        sizeSqft: sSqft,
        pricePerSqft: pSqft,
        totalPrice,
        status,
        dimension: dimension || null,
        facing: facing || null,
      },
    });

    // Update project totalPlots & availablePlots
    await prisma.propertyProject.update({
      where: { id: projectId },
      data: {
        totalPlots: { increment: 1 },
        availablePlots: { increment: 1 },
      },
    }).catch(() => {});

    res.status(201).json(serializePlot(plot));
  } catch (err) {
    next(err);
  }
}

export async function getPlotById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) {
      res.status(404).json({ message: 'Plot not found' });
      return;
    }
    res.json(serializePlot(plot));
  } catch (err) {
    next(err);
  }
}

export async function updatePlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { plotNumber, sizeSqft, pricePerSqft, dimension, facing, status } = req.body;

    const sSqft = sizeSqft ? (typeof sizeSqft === 'string' ? parseFloat(sizeSqft) : sizeSqft) : undefined;
    const pSqft = pricePerSqft ? (typeof pricePerSqft === 'string' ? parseFloat(pricePerSqft) : pricePerSqft) : undefined;

    const updated = await prisma.plot.update({
      where: { id },
      data: {
        ...(plotNumber !== undefined && { plotNumber }),
        ...(sSqft !== undefined && { sizeSqft: sSqft }),
        ...(pSqft !== undefined && { pricePerSqft: pSqft }),
        ...(sSqft && pSqft && { totalPrice: sSqft * pSqft }),
        ...(dimension !== undefined && { dimension }),
        ...(facing !== undefined && { facing }),
        ...(status !== undefined && { status }),
      },
    });

    res.json(serializePlot(updated));
  } catch (err) {
    next(err);
  }
}

export async function holdPlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { holdByCustomer, holdByAgent, holdExpiry } = req.body;

    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) {
      res.status(404).json({ message: 'Plot not found' });
      return;
    }

    if (plot.status === 'Sold') {
      res.status(409).json({ message: 'Plot is already Sold and cannot be put on Hold' });
      return;
    }

    const updated = await prisma.plot.update({
      where: { id },
      data: {
        status: 'Hold',
        holdByCustomer: holdByCustomer || null,
        holdByAgent: holdByAgent || req.user?.name || null,
        holdExpiry: holdExpiry ? new Date(holdExpiry) : new Date(Date.now() + 48 * 3600000), // 48 hour default
      },
    });

    // Update project stats
    await prisma.propertyProject.update({
      where: { id: plot.projectId },
      data: {
        availablePlots: { decrement: 1 },
        holdPlots: { increment: 1 },
      },
    }).catch(() => {});

    res.json(serializePlot(updated));
  } catch (err) {
    next(err);
  }
}

export async function releasePlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const plot = await prisma.plot.findUnique({ where: { id } });
    if (!plot) {
      res.status(404).json({ message: 'Plot not found' });
      return;
    }

    const updated = await prisma.plot.update({
      where: { id },
      data: {
        status: 'Available',
        holdByCustomer: null,
        holdByAgent: null,
        holdExpiry: null,
      },
    });

    // Update project stats
    await prisma.propertyProject.update({
      where: { id: plot.projectId },
      data: {
        availablePlots: { increment: 1 },
        holdPlots: { decrement: 1 },
      },
    }).catch(() => {});

    res.json(serializePlot(updated));
  } catch (err) {
    next(err);
  }
}
