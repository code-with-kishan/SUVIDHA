import twilio from 'twilio';

const hasTwilioConfig =
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_FROM;

export const sendSms = async (to, message) => {
  if (!hasTwilioConfig) {
    console.log(`[MOCK SMS] to=${to}, message=${message}`);
    return { provider: 'mock', sid: `mock-${Date.now()}` };
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const response = await client.messages.create({
    body: message,
    from: process.env.TWILIO_FROM,
    to
  });

  return { provider: 'twilio', sid: response.sid };
};
