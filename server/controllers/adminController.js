import prisma from '../utils/prisma.js';
import { createAuditLog, getRecentAuditLogs } from '../services/auditService.js';
import { getKioskStatusSummary } from '../services/kioskRegistryService.js';

export const getDashboard = async (_req, res) => {
  const [totalUsers, totalRequests, pendingRequests, totalComplaints, totalPayments] =
    await Promise.all([
      prisma.user.count(),
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count(),
      prisma.payment.count({ where: { status: 'SUCCESS' } })
    ]);

  const fraudAlerts = await prisma.auditLog.count({
    where: {
      action: 'PAYMENT_FRAUD_ALERT'
    }
  });

  const kioskSummary = getKioskStatusSummary();

  res.status(200).json({
    totalUsers,
    totalRequests,
    pendingRequests,
    totalComplaints,
    successfulPayments: totalPayments,
    fraudAlerts,
    kiosksOnline: kioskSummary.online,
    kiosksOffline: kioskSummary.offline
  });
};

export const updateStatus = async (req, res) => {
  const id = Number(req.params.id);
  const { status, type } = req.body;

  if (!status || !type) {
    return res.status(400).json({ message: 'status and type are required' });
  }

  let updated;
  if (type === 'service') {
    updated = await prisma.serviceRequest.update({
      where: { id },
      data: { status }
    });
  } else if (type === 'complaint') {
    updated = await prisma.complaint.update({
      where: { id },
      data: { status }
    });
  } else {
    return res.status(400).json({ message: 'type must be service or complaint' });
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'ADMIN_STATUS_UPDATED',
    metadata: { id, status, type }
  });

  res.status(200).json(updated);
};

export const closeItem = async (req, res) => {
  const id = Number(req.params.id);
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({ message: 'type is required' });
  }

  const allowedCloseStatuses = new Set(['RESOLVED', 'REJECTED']);

  if (type === 'service') {
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Service request not found' });
    }
    if (!allowedCloseStatuses.has(existing.status)) {
      return res.status(400).json({ message: 'Only RESOLVED or REJECTED service requests can be closed' });
    }

    await prisma.serviceRequest.delete({ where: { id } });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_SERVICE_CLOSED',
      metadata: { id, referenceCode: existing.referenceCode || null, previousStatus: existing.status }
    });

    return res.status(200).json({ message: 'Service request closed and deleted successfully' });
  }

  if (type === 'complaint') {
    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    if (!allowedCloseStatuses.has(existing.status)) {
      return res.status(400).json({ message: 'Only RESOLVED or REJECTED complaints can be closed' });
    }

    await prisma.complaint.delete({ where: { id } });

    await createAuditLog({
      userId: req.user.id,
      action: 'ADMIN_COMPLAINT_CLOSED',
      metadata: { id, referenceCode: existing.referenceCode || null, previousStatus: existing.status }
    });

    return res.status(200).json({ message: 'Complaint closed and deleted successfully' });
  }

  return res.status(400).json({ message: 'type must be service or complaint' });
};

export const listUsers = async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json(users);
};

export const listRequests = async (_req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    include: {
      user: {
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(requests);
};

export const listComplaints = async (_req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: {
      user: {
        include: {
          documents: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(complaints);
};

export const getSystemHealth = async (_req, res) => {
  const kioskSummary = getKioskStatusSummary();
  const [recentAuditActions, failedPayments] = await Promise.all([
    prisma.auditLog.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.payment.count({ where: { status: 'FAILED' } })
  ]);

  res.status(200).json({
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    kiosks: kioskSummary,
    recentAuditActions,
    failedPayments
  });
};

export const listAuditLogs = async (req, res) => {
  const limit = Number(req.query.limit || 50);
  const logs = await getRecentAuditLogs(limit);
  res.status(200).json(logs);
};
