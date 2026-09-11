import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { logAudit } from '../../middleware/audit';
import { hashPassword } from '../../utils/password';

export function serializeTenant(t: any) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    brandColor: t.brandColor,
    logo: t.logo || undefined,
    tagline: t.tagline || undefined,
    enabledFeatures: typeof t.enabledFeatures === 'string' ? JSON.parse(t.enabledFeatures || '[]') : t.enabledFeatures,
    timezone: t.timezone,
    currency: t.currency,
    businessHours: t.businessHours,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
  };
}

export async function getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(tenants.map(serializeTenant));
  } catch (err) {
    next(err);
  }
}

export async function createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      name,
      slug,
      brandColor,
      logo,
      tagline,
      enabledFeatures,
      timezone,
      currency,
      businessHours,
      adminEmail,
      adminName,
      adminPhone,
    } = req.body;

    if (!name || !slug) {
      res.status(400).json({ message: 'Company name and slug are required' });
      return;
    }

    const existing = await prisma.tenant.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (existing) {
      res.status(409).json({ message: 'Company with this slug already exists' });
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        brandColor: brandColor || '#0284c7',
        logo: logo || null,
        tagline: tagline || null,
        enabledFeatures: JSON.stringify(enabledFeatures || []),
        timezone: timezone || 'Asia/Kolkata (IST)',
        currency: currency || '₹ INR',
        businessHours: businessHours || '09:00 AM - 06:00 PM IST',
        isActive: true,
      },
    });

    // If admin details provided, create initial Company Admin
    if (adminEmail) {
      const defaultPassword = await hashPassword('Admin@123');
      await prisma.user.create({
        data: {
          name: adminName || `${name} Admin`,
          email: adminEmail.toLowerCase().trim(),
          phone: adminPhone || '+91 00000 00000',
          passwordHash: defaultPassword,
          roleCode: 'company_admin',
          companyId: tenant.id,
          companySlug: tenant.slug,
          companyName: tenant.name,
          status: 'Invited',
        },
      });
    }

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_COMPANY',
        entityType: 'Tenant',
        entityId: tenant.id,
        details: `Created company ${tenant.name} (${tenant.slug})`,
      });
    }

    res.status(201).json(serializeTenant(tenant));
  } catch (err) {
    next(err);
  }
}

export async function getCompanyById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!tenant) {
      res.status(404).json({ message: 'Company not found' });
      return;
    }

    res.json(serializeTenant(tenant));
  } catch (err) {
    next(err);
  }
}

export async function updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, brandColor, logo, tagline, timezone, currency, businessHours } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        name,
        brandColor,
        logo,
        tagline,
        timezone,
        currency,
        businessHours,
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'UPDATE_COMPANY',
        entityType: 'Tenant',
        entityId: tenant.id,
        details: `Updated company details for ${tenant.name}`,
      });
    }

    res.json(serializeTenant(tenant));
  } catch (err) {
    next(err);
  }
}

export async function updateFeatures(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { enabledFeatures } = req.body;

    if (!Array.isArray(enabledFeatures)) {
      res.status(400).json({ message: 'enabledFeatures must be an array of feature keys' });
      return;
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        enabledFeatures: JSON.stringify(enabledFeatures),
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'UPDATE_COMPANY_FEATURES',
        entityType: 'Tenant',
        entityId: tenant.id,
        details: `Updated features for ${tenant.name}`,
      });
    }

    res.json(serializeTenant(tenant));
  } catch (err) {
    next(err);
  }
}

export async function activateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.update({
      where: { id },
      data: { isActive: true },
    });
    res.json(serializeTenant(tenant));
  } catch (err) {
    next(err);
  }
}

export async function deactivateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const tenant = await prisma.tenant.update({
      where: { id },
      data: { isActive: false },
    });
    res.json(serializeTenant(tenant));
  } catch (err) {
    next(err);
  }
}
