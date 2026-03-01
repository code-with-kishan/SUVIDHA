import nodemailer from 'nodemailer';

const hasSmtpConfig =
  process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS;

export const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  if (!hasSmtpConfig) {
    console.log(`[MOCK EMAIL] to=${to}, subject=${subject}`);
    return;
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html
  });
};
