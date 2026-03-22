import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { Prisma } from '@prisma/client';

import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import syncRoutes from './routes/syncRoutes.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { kioskDeviceAuth } from './middleware/deviceAuth.js';
import { postKioskHeartbeat } from './controllers/syncController.js';

const app = express();

app.disable('x-powered-by');
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(
  helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  })
);
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(apiRateLimiter);
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SUVIDHA API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.post('/api/health/kiosk-heartbeat', kioskDeviceAuth, postKioskHeartbeat);

app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(500).json({
      message: 'Server schema is out of sync. Please restart backend after Prisma sync.',
      code: 'PRISMA_SCHEMA_SYNC_REQUIRED'
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    code: err.code || 'SERVER_ERROR'
  });
});

export default app;
