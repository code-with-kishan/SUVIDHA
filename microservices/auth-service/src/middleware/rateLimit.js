import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

export const otpRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => req.body?.mobile || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'OTP request limit reached. Please wait before retrying.'
});
