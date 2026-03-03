import bcrypt from 'bcrypt';
import prisma from '../utils/prisma.js';
import { createAuditLog } from '../services/auditService.js';
import { generateOtp, getOtpExpiry } from '../services/otpService.js';
import { signJwt } from '../utils/jwt.js';

export const sendOtp = async (req, res) => {
  const { mobile, email } = req.body;

  if (!mobile || !/^\d{10,15}$/.test(mobile)) {
    return res.status(400).json({ message: 'Valid mobile number is required' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email is required' });
  }

  const otp = generateOtp();
  const expiresAt = getOtpExpiry();

  await prisma.oTPVerification.create({
    data: { mobile, otp, expiresAt }
  });

  await createAuditLog({
    userId: null,
    action: 'AUTH_SEND_OTP',
    metadata: { mobile, email }
  });

  res.status(200).json({
    message: 'OTP generated',
    channels: { sms: true, email: true },
    ...(process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {})
  });
};

export const verifyOtp = async (req, res) => {
  const { mobile, otp, name, email, aadhaar } = req.body;

  if (!mobile || !otp || !name || !email || !aadhaar) {
    return res.status(400).json({ message: 'mobile, otp, name, email and aadhaar are required' });
  }

  const record = await prisma.oTPVerification.findFirst({
    where: { mobile, otp, verified: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) return res.status(400).json({ message: 'Invalid OTP' });
  if (new Date() > record.expiresAt) return res.status(400).json({ message: 'OTP expired' });

  await prisma.oTPVerification.update({ where: { id: record.id }, data: { verified: true } });

  let user = await prisma.user.findUnique({ where: { mobile } });
  if (!user) {
    user = await prisma.user.create({
      data: { mobile, name, email, aadhaar, role: 'CITIZEN' }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name, email, aadhaar }
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
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.status(200).json(user);
};

export const adminLogin = async (req, res) => {
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

  const token = signJwt({ id: admin.id, mobile: admin.mobile, role: admin.role });

  await createAuditLog({
    userId: admin.id,
    action: 'ADMIN_LOGIN_SUCCESS',
    metadata: { mobile }
  });

  res.status(200).json({ token, user: admin });
};
