import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';
import { generateUniqueReferenceCode } from '../utils/referenceCode.js';

export const createComplaint = async (req, res) => {
  const { category, description } = req.body;
  if (!category || !description) {
    return res.status(400).json({ message: 'category and description are required' });
  }

  const referenceCode = await generateUniqueReferenceCode(prisma);

  const complaint = await prisma.complaint.create({
    data: {
      userId: req.user.id,
      referenceCode,
      category,
      description
    }
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'COMPLAINT_CREATED',
    metadata: { complaintId: complaint.id, referenceCode: complaint.referenceCode, category }
  });

  res.status(201).json(complaint);
};

export const getUserComplaints = async (req, res) => {
  const complaints = await prisma.complaint.findMany({
    where: req.user.role === 'CITIZEN' ? { userId: req.user.id } : undefined,
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json(complaints);
};
