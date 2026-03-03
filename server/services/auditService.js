import prisma from '../utils/prisma.js';
import crypto from 'crypto';

let previousHash = 'GENESIS';

export const createAuditLog = async ({ userId, action, metadata }) => {
  try {
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
        metadata: JSON.stringify({
          ...payload,
          hash
        })
      }
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};

export const getRecentAuditLogs = async (limit = 100) => {
  const logs = await prisma.auditLog.findMany({
    take: Math.min(limit, 200),
    orderBy: { timestamp: 'desc' },
    include: { user: true }
  });

  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    timestamp: log.timestamp,
    user: log.user
      ? {
          id: log.user.id,
          name: log.user.name,
          role: log.user.role
        }
      : null,
    metadata: (() => {
      try {
        return log.metadata ? JSON.parse(log.metadata) : null;
      } catch (_error) {
        return { raw: log.metadata };
      }
    })()
  }));
};
