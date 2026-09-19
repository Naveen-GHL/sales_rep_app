const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/schema');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../../../data/uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
];

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

// POST /files/upload — upload a file
router.post('/upload', authenticate, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds 25MB limit' } });
      }
      return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } });
    }

    if (!req.file) {
      return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }

    const { conversationId, category = 'Document', permission = 'view_download' } = req.body;
    const fileId = uuidv4();
    const companyId = req.user.company_id || 't-ghl-01';
    db.prepare(`
      INSERT INTO files (id, original_name, stored_name, mime_type, size, conversation_id, uploaded_by, company_id, category, permission)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, conversationId || null, req.user.id, companyId, category, permission);

    return res.status(201).json({
      id: fileId,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size,
      uploaded_by: req.user.id,
      category,
      permission,
    });
  });
});

// GET /files/:id — get file metadata + download URL (Scoped to company_id)
router.get('/:id', authenticate, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
  
  const userCompany = req.user.company_id || 't-ghl-01';
  if (file.company_id && file.company_id !== userCompany) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: File belongs to another organization' } });
  }

  return res.json({
    ...file,
    downloadUrl: `/api/files/${file.id}/download`,
  });
});

// GET /files/:id/download — stream file (Enforce server-side read_only permission)
router.get('/:id/download', authenticate, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });

  const userCompany = req.user.company_id || 't-ghl-01';
  if (file.company_id && file.company_id !== userCompany) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: File belongs to another organization' } });
  }

  // Enforce read_only: only uploader or company admin can download
  if (file.permission === 'read_only' && file.uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Downloading is restricted: This file was shared with Read-only permissions.',
      },
    });
  }

  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found on disk' } });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
  res.setHeader('Content-Type', file.mime_type);
  res.sendFile(filePath);
});

// DELETE /files/:id
router.delete('/:id', authenticate, (req, res) => {
  const file = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
  if (!file) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'File not found' } });
  if (file.uploaded_by !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Cannot delete another user\'s file' } });
  }
  const filePath = path.join(UPLOADS_DIR, file.stored_name);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);
  return res.status(204).send();
});

module.exports = router;
