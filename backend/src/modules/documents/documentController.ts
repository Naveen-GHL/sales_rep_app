import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import fs from 'fs';
import path from 'path';

export function serializeDocument(doc: any) {
  return {
    id: doc.id,
    name: doc.name,
    size: doc.size,
    type: doc.type,
    uploadedBy: doc.uploadedBy,
    uploadedAt: doc.uploadedAt.toISOString ? doc.uploadedAt.toISOString() : doc.uploadedAt,
    category: doc.category,
    url: doc.url,
  };
}

export async function getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = req.companyId || req.user?.companyId;
    const { entityType, entityId } = req.query;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (entityType) where.entityType = entityType as string;
    if (entityId) where.entityId = entityId as string;

    const docs = await prisma.documentItem.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(docs.map(serializeDocument));
  } catch (err) {
    next(err);
  }
}

export async function uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const file = req.file;
    const { entityType = 'general', entityId = 'global', category = 'General' } = req.body;
    const companyId = req.companyId || req.user?.companyId || 'company';

    if (!file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const doc = await prisma.documentItem.create({
      data: {
        companyId,
        entityType,
        entityId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        uploadedBy: req.user?.name || 'User',
        category,
        filePath: file.path,
        url: `/uploads/${file.filename}`,
      },
    });

    res.status(201).json(serializeDocument(doc));
  } catch (err) {
    next(err);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await prisma.documentItem.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Check if download requested
    if (req.query.download === 'true' && fs.existsSync(doc.filePath)) {
      res.download(doc.filePath, doc.name);
      return;
    }

    res.json(serializeDocument(doc));
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await prisma.documentItem.findUnique({ where: { id } });
    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (e) {}
    }

    await prisma.documentItem.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
