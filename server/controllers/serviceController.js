import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';
import { generateUniqueReferenceCode } from '../utils/referenceCode.js';

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

  const referenceCode = await generateUniqueReferenceCode(prisma);

  const request = await prisma.serviceRequest.create({
    data: {
      userId: req.user.id,
      referenceCode,
      serviceType,
      description
    }
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'SERVICE_REQUEST_CREATED',
    metadata: { requestId: request.id, referenceCode: request.referenceCode, serviceType }
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
  const trackingInput = String(req.params.id || '').trim();

  if (!trackingInput) {
    return res.status(400).json({ message: 'Valid application/reference ID is required' });
  }

  const requestByReference = await prisma.serviceRequest.findFirst({ where: { referenceCode: trackingInput } });
  if (requestByReference) {
    if (req.user.role === 'CITIZEN' && requestByReference.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({
      applicationType: 'SERVICE_REQUEST',
      id: requestByReference.id,
      referenceCode: requestByReference.referenceCode,
      category: requestByReference.serviceType,
      description: requestByReference.description,
      status: requestByReference.status,
      createdAt: requestByReference.createdAt,
      updatedAt: requestByReference.updatedAt
    });
  }

  const complaintByReference = await prisma.complaint.findFirst({ where: { referenceCode: trackingInput } });
  if (complaintByReference) {
    if (req.user.role === 'CITIZEN' && complaintByReference.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({
      applicationType: 'COMPLAINT',
      id: complaintByReference.id,
      referenceCode: complaintByReference.referenceCode,
      category: complaintByReference.category,
      description: complaintByReference.description,
      status: complaintByReference.status,
      createdAt: complaintByReference.createdAt,
      updatedAt: complaintByReference.updatedAt
    });
  }

  const legacyId = Number(trackingInput);

  if (!Number.isInteger(legacyId) || legacyId <= 0) {
    return res.status(404).json({ message: 'No record found for this application/reference ID' });
  }

  const request = await prisma.serviceRequest.findUnique({ where: { id: legacyId } });
  if (request) {
    if (req.user.role === 'CITIZEN' && request.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({
      applicationType: 'SERVICE_REQUEST',
      id: request.id,
      referenceCode: request.referenceCode,
      category: request.serviceType,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    });
  }

  const complaint = await prisma.complaint.findUnique({ where: { id: legacyId } });
  if (complaint) {
    if (req.user.role === 'CITIZEN' && complaint.userId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(200).json({
      applicationType: 'COMPLAINT',
      id: complaint.id,
      referenceCode: complaint.referenceCode,
      category: complaint.category,
      description: complaint.description,
      status: complaint.status,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt
    });
  }

  return res.status(404).json({ message: 'No record found for this application/reference ID' });
};
