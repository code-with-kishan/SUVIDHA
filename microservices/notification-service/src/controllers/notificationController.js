import { sendEmail } from '../services/emailService.js';
import { sendSms } from '../services/smsService.js';

export const sendSmsNotification = async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ message: 'to and message are required' });
  }

  const result = await sendSms(to, message);
  res.status(200).json({ delivered: true, channel: 'sms', result });
};

export const sendEmailNotification = async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'to, subject and html are required' });
  }

  const result = await sendEmail({ to, subject, html });
  res.status(200).json({ delivered: true, channel: 'email', result });
};
