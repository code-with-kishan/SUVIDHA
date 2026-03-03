import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';
import { assessTransactionRisk } from '../services/fraudDetectionService.js';

export const createPayment = async (req, res) => {
  const { amount, serviceType } = req.body;

  if (!amount || !serviceType) {
    return res.status(400).json({ message: 'amount and serviceType are required' });
  }

  const [user, recentFailures, rapidAttempts] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.user.id } }),
    prisma.payment.count({
      where: {
        userId: req.user.id,
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    }),
    prisma.payment.count({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000)
        }
      }
    })
  ]);

  const risk = assessTransactionRisk({
    amount,
    user,
    recentFailures,
    rapidAttempts
  });

  const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const payment = await prisma.payment.create({
    data: {
      userId: req.user.id,
      amount,
      serviceType,
      status: 'CREATED',
      transactionId
    }
  });

  if (risk.riskLevel === 'HIGH') {
    await createAuditLog({
      userId: req.user.id,
      action: 'PAYMENT_FRAUD_ALERT',
      metadata: {
        paymentId: payment.id,
        amount,
        serviceType,
        risk
      }
    });
  }

  res.status(201).json({ payment, risk });
};

export const verifyPayment = async (req, res) => {
  const { paymentId, status } = req.body;

  if (!paymentId || !status) {
    return res.status(400).json({ message: 'paymentId and status are required' });
  }

  const payment = await prisma.payment.findUnique({ where: { id: Number(paymentId) } });
  if (!payment || payment.userId !== req.user.id) {
    return res.status(404).json({ message: 'Payment not found' });
  }

  const normalizedStatus = status === 'SUCCESS' ? 'SUCCESS' : 'FAILED';

  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: normalizedStatus }
  });

  let receipt = null;
  if (normalizedStatus === 'SUCCESS') {
    receipt = await prisma.receipt.create({
      data: {
        userId: req.user.id,
        paymentId: payment.id,
        receiptUrl: `/receipts/${updated.transactionId}.pdf`
      }
    });
  }

  await createAuditLog({
    userId: req.user.id,
    action: 'PAYMENT_VERIFIED',
    metadata: {
      paymentId: payment.id,
      status: normalizedStatus
    }
  });

  res.status(200).json({ payment: updated, receipt });
};
