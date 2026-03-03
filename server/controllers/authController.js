import bcrypt from 'bcrypt';
import prisma from '../utils/prisma.js';
import { generateOtp, getOtpExpiry } from '../utils/otp.js';
import { signJwt, signJwtWithOptions, verifyJwt } from '../utils/jwt.js';
import { sendSms } from '../services/smsService.js';
import { sendEmail } from '../services/emailService.js';
import { createAuditLog } from '../services/auditService.js';

const ADMIN_MFA_PURPOSE = 'ADMIN_MFA_CHALLENGE';

export const sendOtp = async (req, res) => {
  const { mobile, email } = req.body;

  if (!mobile || !/^\d{10,15}$/.test(mobile)) {
    return res.status(400).json({ message: 'Valid mobile number is required' });
  }
  if (!email) {
    return res.status(400).json({ message: 'Email is required for OTP delivery' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();
  const existingUser = await prisma.user.findUnique({ where: { mobile } });
  const targetEmail = email;

  await prisma.oTPVerification.create({
    data: { mobile, otp, expiresAt }
  });

  await sendEmail({
    to: targetEmail,
    subject: 'SUVIDHA OTP Verification',
    html: `<p>Your SUVIDHA OTP is <b>${otp}</b>. It is valid for 2 minutes.</p>`
  });

  await createAuditLog({
    userId: existingUser?.id || null,
    action: 'AUTH_SEND_OTP',
    metadata: { mobile, email: targetEmail || null, otpChannel: 'email' }
  });

  res.status(200).json({
    message: 'OTP sent successfully to email',
    channels: {
      sms: false,
      email: true
    },
    smsProvider: 'disabled',
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {})
  });
};

export const verifyOtp = async (req, res) => {
  const { mobile, otp, name, email, aadhaar } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile and OTP are required' });
  }
  if (!name || !email || !aadhaar) {
    return res.status(400).json({ message: 'Name, Email, and Aadhaar are required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }

  const record = await prisma.oTPVerification.findFirst({
    where: { mobile, otp, verified: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  if (new Date() > record.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  await prisma.oTPVerification.update({
    where: { id: record.id },
    data: { verified: true }
  });

  let user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        mobile,
        name: name || 'Citizen',
        email,
        aadhaar,
        role: 'CITIZEN'
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name || user.name,
        email,
        aadhaar
      }
    });
  }

  const token = signJwt({ id: user.id, mobile: user.mobile, role: user.role });

  await createAuditLog({
    userId: user.id,
    action: 'AUTH_VERIFY_OTP_SUCCESS',
    metadata: { mobile }
  });

  res.status(200).json({ token, user });
};

export const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(200).json(user);
};

export const adminLoginInit = async (req, res) => {
  const { mobile, password } = req.body;

  if (!mobile || !password) {
    return res.status(400).json({ message: 'Mobile and password are required' });
  }

  const admin = await prisma.user.findUnique({ where: { mobile } });
  if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role) || !admin.passwordHash) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.oTPVerification.create({
    data: { mobile: admin.mobile, otp, expiresAt }
  });

  await sendSms(admin.mobile, `Your SUVIDHA admin login OTP is ${otp}. It is valid for 2 minutes.`);
  if (admin.email) {
    await sendEmail({
      to: admin.email,
      subject: 'SUVIDHA Admin Login OTP',
      html: `<p>Your SUVIDHA admin OTP is <b>${otp}</b>. It is valid for 2 minutes.</p>`
    });
  }

  const mfaToken = signJwtWithOptions(
    {
      id: admin.id,
      mobile: admin.mobile,
      role: admin.role,
      purpose: ADMIN_MFA_PURPOSE
    },
    { expiresIn: '5m' }
  );

  await createAuditLog({
    userId: admin.id,
    action: 'ADMIN_MFA_INIT',
    metadata: { mobile: admin.mobile, channels: { sms: true, email: Boolean(admin.email) } }
  });

  res.status(200).json({
    message: 'OTP sent for admin login verification',
    mfaToken,
    channels: { sms: true, email: Boolean(admin.email) },
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {})
  });
};

export const adminLoginVerify = async (req, res) => {
  const { mfaToken, otp } = req.body;

  if (!mfaToken || !otp) {
    return res.status(400).json({ message: 'mfaToken and otp are required' });
  }

  let challenge;
  try {
    challenge = verifyJwt(mfaToken);
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid or expired MFA challenge' });
  }

  if (challenge.purpose !== ADMIN_MFA_PURPOSE) {
    return res.status(401).json({ message: 'Invalid MFA challenge purpose' });
  }

  const record = await prisma.oTPVerification.findFirst({
    where: {
      mobile: challenge.mobile,
      otp,
      verified: false
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  if (new Date() > record.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  await prisma.oTPVerification.update({
    where: { id: record.id },
    data: { verified: true }
  });

  const admin = await prisma.user.findUnique({ where: { mobile: challenge.mobile } });
  if (!admin || !['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return res.status(401).json({ message: 'Invalid admin account' });
  }

  const token = signJwt({ id: admin.id, mobile: admin.mobile, role: admin.role });

  await createAuditLog({
    userId: admin.id,
    action: 'ADMIN_LOGIN_SUCCESS',
    metadata: { mobile: admin.mobile, mfa: true }
  });

  res.status(200).json({ token, user: admin });
};

export const adminLogin = async (_req, res) => {
  res.status(428).json({ message: 'Admin MFA is required. Use /api/admin/login then /api/admin/login/verify.' });
};
