import fs from 'fs';
import path from 'path';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const getFileUrl = (filename) => {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5003';
  return `${baseUrl}/uploads/${filename}`;
};

export const getUploadDir = () => uploadDir;
