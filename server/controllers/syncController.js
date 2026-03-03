import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';
import { updateKioskHeartbeat } from '../services/kioskRegistryService.js';

const validateQueueItem = (item) => {
  if (!item || typeof item !== 'object') return false;
  return Boolean(item.type && item.payload && item.clientQueueId);
};

export const pushOfflineQueue = async (req, res) => {
  const { queue } = req.body;

  if (!Array.isArray(queue) || queue.length === 0) {
    return res.status(400).json({ message: 'queue must be a non-empty array' });
  }

  const results = [];

  for (const item of queue) {
    if (!validateQueueItem(item)) {
      results.push({
        clientQueueId: item?.clientQueueId || null,
        status: 'REJECTED',
        reason: 'Invalid queue item structure'
      });
      continue;
    }

    try {
      if (item.type === 'SERVICE_REQUEST_CREATE') {
        const record = await prisma.serviceRequest.create({
          data: {
            userId: req.user.id,
            serviceType: item.payload.serviceType,
            description: item.payload.description
          }
        });

        results.push({ clientQueueId: item.clientQueueId, status: 'SYNCED', recordId: record.id });
      } else if (item.type === 'COMPLAINT_CREATE') {
        const record = await prisma.complaint.create({
          data: {
            userId: req.user.id,
            category: item.payload.category,
            description: item.payload.description
          }
        });

        results.push({ clientQueueId: item.clientQueueId, status: 'SYNCED', recordId: record.id });
      } else {
        results.push({
          clientQueueId: item.clientQueueId,
          status: 'REJECTED',
          reason: `Unsupported queue type: ${item.type}`
        });
      }
    } catch (error) {
      results.push({
        clientQueueId: item.clientQueueId,
        status: 'FAILED',
        reason: error.message
      });
    }
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'OFFLINE_QUEUE_SYNC',
    metadata: {
      received: queue.length,
      synced: results.filter((item) => item.status === 'SYNCED').length,
      rejected: results.filter((item) => item.status === 'REJECTED').length,
      failed: results.filter((item) => item.status === 'FAILED').length
    }
  });

  res.status(200).json({ results });
};

export const postKioskHeartbeat = async (req, res) => {
  const { kioskId } = req.kiosk;
  const { appVersion, online, health } = req.body;

  updateKioskHeartbeat({
    kioskId,
    metadata: {
      appVersion: appVersion || 'unknown',
      online: Boolean(online),
      health: health || 'OK'
    }
  });

  res.status(200).json({ message: 'Heartbeat accepted', kioskId });
};
