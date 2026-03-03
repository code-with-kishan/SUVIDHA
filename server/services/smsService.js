import twilio from 'twilio';

const hasTwilioConfig =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM;

const normalizePhoneNumber = (rawNumber) => {
  const digits = String(rawNumber || '').replace(/\D+/g, '');
  if (!digits) return '';

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return rawNumber;
};

export const sendSms = async (to, message) => {
  const target = normalizePhoneNumber(to);

  if (!hasTwilioConfig) {
    console.log(`[MOCK SMS] to=${target || to}, message=${message}`);
    return { provider: 'mock', sid: `mock-${Date.now()}`, to: target || to };
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const response = await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM,
    to: target
  });

  return { provider: 'twilio', sid: response.sid, to: target };
};
