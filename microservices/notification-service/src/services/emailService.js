import nodemailer from 'nodemailer';

const hasSmtpConfig =
  process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

export const sendEmail = async ({ to, subject, html }) => {
  if (!hasSmtpConfig) {
    return { provider: 'mock', id: `mock-${Date.now()}`, to, subject };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });

  return { provider: 'smtp', id: info.messageId };
};
