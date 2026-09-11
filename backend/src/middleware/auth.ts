import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { prisma } from '../prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.status === 'Disabled') {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const role = await prisma.role.findUnique({
      where: { code: user.roleCode },
    });

    const permissions: string[] = role ? JSON.parse(role.permissions) : [];

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleCode: user.roleCode,
      permissions,
      companyId: user.companyId,
      companySlug: user.companySlug,
      companyName: user.companyName,
      status: user.status,
      avatar: user.avatar,
    };

    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
