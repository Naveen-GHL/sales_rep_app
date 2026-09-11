import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { hashPassword } from '../../utils/password';
import { logAudit } from '../../middleware/audit';

export async function serializeUser(u: any) {
  const roleRecord = await prisma.role.findUnique({
    where: { code: u.roleCode },
  });
  const permissions = roleRecord ? JSON.parse(roleRecord.permissions) : [];
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: {
      id: roleRecord?.id || 'role-id',
      name: roleRecord?.name || u.roleCode,
      code: u.roleCode,
      permissions,
    },
    companyId: u.companyId || undefined,
    companySlug: u.companySlug || undefined,
    companyName: u.companyName || undefined,
    status: u.status,
    lastLogin: u.lastLogin ? u.lastLogin.toISOString() : undefined,
    avatar: u.avatar || undefined,
  };
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const where: any = {};
    if (req.user?.roleCode === 'super_admin') {
      const companyId = req.query.companyId as string;
      if (companyId) {
        where.companyId = companyId;
      }
    } else {
      where.companyId = req.user?.companyId;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const serialized = await Promise.all(users.map(serializeUser));
    res.json(serialized);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, roleCode, companyId, password } = req.body;

    if (!name || !email || !roleCode) {
      res.status(400).json({ message: 'Name, email, and roleCode are required' });
      return;
    }

    const targetCompanyId = req.user?.roleCode === 'super_admin' ? companyId : req.user?.companyId;

    let targetCompanySlug = null;
    let targetCompanyName = null;

    if (targetCompanyId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: targetCompanyId },
      });
      if (tenant) {
        targetCompanySlug = tenant.slug;
        targetCompanyName = tenant.name;
      }
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      res.status(409).json({ message: 'User with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password || 'Admin@123');

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || '',
        passwordHash,
        roleCode,
        companyId: targetCompanyId,
        companySlug: targetCompanySlug,
        companyName: targetCompanyName,
        status: 'Active',
      },
    });

    if (req.user) {
      await logAudit({
        actorName: req.user.name,
        actorEmail: req.user.email,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: newUser.id,
        companyId: targetCompanyId,
        companyName: targetCompanyName,
        details: `Created user ${newUser.email} with role ${roleCode}`,
      });
    }

    const result = await serializeUser(newUser);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Boundary check
    if (req.user?.roleCode !== 'super_admin' && user.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json(await serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { name, phone, roleCode, status } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (req.user?.roleCode !== 'super_admin' && user.companyId !== req.user?.companyId) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name,
        phone,
        roleCode,
        status,
      },
    });

    res.json(await serializeUser(updated));
  } catch (err) {
    next(err);
  }
}

export async function disableUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'Disabled' },
    });
    res.json(await serializeUser(updated));
  } catch (err) {
    next(err);
  }
}

export async function enableUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id },
      data: { status: 'Active' },
    });
    res.json(await serializeUser(updated));
  } catch (err) {
    next(err);
  }
}
