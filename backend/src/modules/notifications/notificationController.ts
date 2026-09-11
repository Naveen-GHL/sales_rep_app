import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export function serializeNotification(n: any) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.timestamp.toISOString ? n.timestamp.toISOString() : n.timestamp,
    read: n.read,
    link: n.link || undefined,
  };
}

export async function getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { read, type } = req.query;
    const where: any = { userId };
    if (read !== undefined) {
      where.read = read === 'true';
    }
    if (type) {
      where.type = type as string;
    }

    const items = await prisma.notificationItem.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    res.json(items.map(serializeNotification));
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const item = await prisma.notificationItem.update({
      where: { id },
      data: { read: true },
    });
    res.json(serializeNotification(item));
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    await prisma.notificationItem.updateMany({
      where: { userId },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}
