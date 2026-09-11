import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { comparePassword, hashPassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../../utils/token';
import { logAudit } from '../../middleware/audit';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (user.status === 'Disabled') {
      res.status(403).json({ message: 'Account is disabled. Please contact administrator.' });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Fetch Role
    const roleRecord = await prisma.role.findUnique({
      where: { code: user.roleCode },
    });
    const permissions: string[] = roleRecord ? JSON.parse(roleRecord.permissions) : [];
    const role = {
      id: roleRecord?.id || 'role-id',
      name: roleRecord?.name || user.roleCode,
      code: user.roleCode,
      permissions,
    };

    // Fetch Tenant if user has companyId
    let tenant = null;
    if (user.companyId) {
      const tenantRecord = await prisma.tenant.findUnique({
        where: { id: user.companyId },
      });
      if (tenantRecord) {
        tenant = {
          id: tenantRecord.id,
          name: tenantRecord.name,
          slug: tenantRecord.slug,
          brandColor: tenantRecord.brandColor,
          logo: tenantRecord.logo || undefined,
          tagline: tenantRecord.tagline || undefined,
          enabledFeatures: JSON.parse(tenantRecord.enabledFeatures || '[]'),
          timezone: tenantRecord.timezone,
          currency: tenantRecord.currency,
          businessHours: tenantRecord.businessHours,
        };
      }
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      companySlug: user.companySlug,
      roleCode: user.roleCode,
    };

    const token = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await logAudit({
      actorName: user.name,
      actorEmail: user.email,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
      companyId: user.companyId,
      companyName: user.companyName,
      details: 'User successfully logged in',
    });

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role,
        companyId: user.companyId || undefined,
        companySlug: user.companySlug || undefined,
        companyName: user.companyName || undefined,
        status: user.status,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
        avatar: user.avatar || undefined,
      },
      tenant,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken: rToken } = req.body;
    if (!rToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const payload = verifyRefreshToken(rToken);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status === 'Disabled') {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      companySlug: user.companySlug,
      roleCode: user.roleCode,
    });

    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await logAudit({
      actorName: req.user.name,
      actorEmail: req.user.email,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: req.user.id,
      companyId: req.user.companyId,
      companyName: req.user.companyName,
    });
  }
  res.status(204).send();
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  // Return 204 always to prevent email enumeration
  res.status(204).send();
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ message: 'Token and newPassword are required' });
      return;
    }

    const payload = verifyAccessToken(token);
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!userRecord) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const roleRecord = await prisma.role.findUnique({
      where: { code: userRecord.roleCode },
    });
    const permissions: string[] = roleRecord ? JSON.parse(roleRecord.permissions) : [];
    const role = {
      id: roleRecord?.id || 'role-id',
      name: roleRecord?.name || userRecord.roleCode,
      code: userRecord.roleCode,
      permissions,
    };

    let tenant = null;
    let enabledFeatures: string[] = [];
    if (userRecord.companyId) {
      const tenantRecord = await prisma.tenant.findUnique({
        where: { id: userRecord.companyId },
      });
      if (tenantRecord) {
        enabledFeatures = JSON.parse(tenantRecord.enabledFeatures || '[]');
        tenant = {
          id: tenantRecord.id,
          name: tenantRecord.name,
          slug: tenantRecord.slug,
          brandColor: tenantRecord.brandColor,
          logo: tenantRecord.logo || undefined,
          tagline: tenantRecord.tagline || undefined,
          enabledFeatures,
          timezone: tenantRecord.timezone,
          currency: tenantRecord.currency,
          businessHours: tenantRecord.businessHours,
        };
      }
    }

    res.json({
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role,
        companyId: userRecord.companyId || undefined,
        companySlug: userRecord.companySlug || undefined,
        companyName: userRecord.companyName || undefined,
        status: userRecord.status,
        lastLogin: userRecord.lastLogin ? userRecord.lastLogin.toISOString() : undefined,
        avatar: userRecord.avatar || undefined,
      },
      tenant,
      enabledFeatures,
      permissions,
    });
  } catch (err) {
    next(err);
  }
}
