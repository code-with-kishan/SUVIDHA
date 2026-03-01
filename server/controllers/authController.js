import bcrypt from 'bcrypt';
import prisma from '../utils/prisma.js';
import { generateOtp, getOtpExpiry } from '../utils/otp.js';
import { signJwt } from '../utils/jwt.js';
import { sendSms } from '../services/smsService.js';
import { sendEmail } from '../services/emailService.js';
import { createAuditLog } from '../services/auditService.js';

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

  await sendSms(mobile, `Your SUVIDHA OTP is ${otp}. It is valid for 2 minutes.`);
  if (targetEmail) {
    await sendEmail({
      to: targetEmail,
      subject: 'SUVIDHA OTP Verification',
      html: `<p>Your SUVIDHA OTP is <b>${otp}</b>. It is valid for 2 minutes.</p>`
    });
  }

  await createAuditLog({
    userId: existingUser?.id || null,
    action: 'AUTH_SEND_OTP',
    metadata: { mobile, email: targetEmail || null }
  });

  res.status(200).json({
    message: 'OTP sent successfully',
    channels: {
      sms: true,
      email: Boolean(targetEmail)
    },
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
  res.status(200).json({ token, user: admin });
};
