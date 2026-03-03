import multer from 'multer';
import path from 'path';
import prisma from '../utils/prisma.js';
import { getUploadDir } from '../services/storageService.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, getUploadDir()),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Only PDF and image files are allowed'));
  }
  cb(null, true);
};

export const uploadMiddleware = multer({ storage, fileFilter }).single('file');

export const uploadDocument = async (req, res) => {
  const { docType, consent } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'File is required' });
  }
  if (consent !== 'true' && consent !== true) {
    return res.status(400).json({ message: 'Consent is required before upload' });
  }

  const origin = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${origin}/uploads/${req.file.filename}`;

  const document = await prisma.document.create({
    data: {
      userId: req.user.id,
      fileUrl,
      docType: docType || 'GENERAL'
    }
  });

  res.status(201).json(document);
};

export const getUserDocuments = async (req, res) => {
  const documents = await prisma.document.findMany({
    where: req.user.role === 'CITIZEN' ? { userId: req.user.id } : undefined,
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(documents);
};
