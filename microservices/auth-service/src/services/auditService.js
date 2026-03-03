import crypto from 'crypto';
import prisma from '../utils/prisma.js';

let previousHash = 'GENESIS';

export const createAuditLog = async ({ userId, action, metadata }) => {
  const payload = {
    userId: userId || null,
    action,
    metadata: metadata || null,
    at: new Date().toISOString(),
    prevHash: previousHash
  };

  const hash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  previousHash = hash;

  await prisma.auditLog.create({
    data: {
      userId,
      action,
      metadata: JSON.stringify({ ...payload, hash })
    }
  });
};
