import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';

export const getDashboard = async (_req, res) => {
  const [totalUsers, totalRequests, pendingRequests, totalComplaints, totalPayments] =
    await Promise.all([
      prisma.user.count(),
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      prisma.complaint.count(),
      prisma.payment.count({ where: { status: 'SUCCESS' } })
    ]);

  res.status(200).json({
    totalUsers,
    totalRequests,
    pendingRequests,
    totalComplaints,
    successfulPayments: totalPayments
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

export const listUsers = async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.status(200).json(users);
};

export const listRequests = async (_req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(requests);
};

export const listComplaints = async (_req, res) => {
  const complaints = await prisma.complaint.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json(complaints);
};
