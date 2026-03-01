import crypto from 'crypto';

export const createHmacSignature = (payload) => {
  const key = process.env.HMAC_SECRET || 'suvidha-dev-hmac';
  return crypto
    .createHmac('sha256', key)
    .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
    .digest('hex');
};
