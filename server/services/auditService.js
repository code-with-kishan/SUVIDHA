import prisma from '../utils/prisma.js';

export const createAuditLog = async ({ userId, action, metadata }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  } catch (error) {
    console.error('Audit log error:', error.message);
  }
};
