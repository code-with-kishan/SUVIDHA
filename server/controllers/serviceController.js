import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';

export const getServices = async (_req, res) => {
  res.status(200).json([
    { key: 'electricity', label: 'Electricity Services' },
    { key: 'water', label: 'Water Services' },
    { key: 'gas', label: 'Gas Services' },
    { key: 'municipal', label: 'Municipal Services' }
  ]);
};

export const createServiceRequest = async (req, res) => {
  const { serviceType, description } = req.body;

  if (!serviceType || !description) {
    return res.status(400).json({ message: 'serviceType and description are required' });
  }

  const request = await prisma.serviceRequest.create({
    data: {
      userId: req.user.id,
      serviceType,
      description
    }
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'SERVICE_REQUEST_CREATED',
    metadata: { requestId: request.id, serviceType }
  });

  res.status(201).json(request);
};

export const getServiceStatus = async (req, res) => {
  const id = Number(req.params.id);
  const request = await prisma.serviceRequest.findUnique({ where: { id } });

  if (!request) {
    return res.status(404).json({ message: 'Service request not found' });
  }

  if (req.user.role === 'CITIZEN' && request.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.status(200).json(request);
};

export const getApplicationStatus = async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Valid application ID is required' });
  }

  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (request) {
    if (req.user.role === 'CITIZEN' && request.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({
      applicationType: 'SERVICE_REQUEST',
      id: request.id,
      category: request.serviceType,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    });
  }

  const complaint = await prisma.complaint.findUnique({ where: { id } });
  if (complaint) {
    if (req.user.role === 'CITIZEN' && complaint.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({
      applicationType: 'COMPLAINT',
      id: complaint.id,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.createdAt
    });
  }

  return res.status(404).json({ message: 'No record found for this application ID' });
};
