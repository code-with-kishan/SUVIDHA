import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 5000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5101';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5102';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5104';
const CORE_SERVICE_URL = process.env.CORE_SERVICE_URL || 'http://localhost:5003';

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

app.use(
  '/api/auth',
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/auth/' }
  })
);

app.use(
  '/api/payments',
  createProxyMiddleware({
    target: PAYMENT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/payments/' }
  })
);

app.use(
  '/api/notifications',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/notifications/' }
  })
);

app.use(
  '/api/admin',
  createProxyMiddleware({
    target: CORE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/admin/' }
  })
);

app.use(
  '/api/services',
  createProxyMiddleware({
    target: CORE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/services/' }
  })
);

app.use(
  '/api/complaints',
  createProxyMiddleware({
    target: CORE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/complaints/' }
  })
);

app.use(
  '/api/documents',
  createProxyMiddleware({
    target: CORE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/documents/' }
  })
);

app.use(
  '/api/sync',
  createProxyMiddleware({
    target: CORE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/api/sync/' }
  })
);

app.use(
  '/uploads',
  createProxyMiddleware({
    target: CORE_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/': '/uploads/' }
  })
);

app.listen(PORT, () => {
  console.log(`SUVIDHA api-gateway running on port ${PORT}`);
});
