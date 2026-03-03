import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import paymentRoutes from './routes/paymentRoutes.js';
import { apiRateLimiter } from './middleware/rateLimit.js';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(apiRateLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'payment-fraud-service' });
});

app.use('/payments', paymentRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    code: err.code || 'SERVER_ERROR'
  });
});

export default app;
