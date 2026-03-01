import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from './prisma.js';

const run = async () => {
  const adminMobile = process.env.DEFAULT_ADMIN_MOBILE || '9999999999';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.DEFAULT_ADMIN_NAME || 'SUVIDHA Admin';
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@suvidha.local';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const existing = await prisma.user.findUnique({ where: { mobile: adminMobile } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: adminName,
        email: adminEmail,
        role: 'ADMIN',
        passwordHash
      }
    });
  } else {
    await prisma.user.create({
      data: {
        name: adminName,
        mobile: adminMobile,
        email: adminEmail,
        role: 'ADMIN',
        passwordHash
      }
    });
  }

  console.log('Admin user seeded successfully.');
  console.log(`Mobile: ${adminMobile}`);
  console.log(`Password: ${adminPassword}`);

  await prisma.$disconnect();
};

run().catch(async (error) => {
  console.error('Failed to seed admin:', error);
  await prisma.$disconnect();
  process.exit(1);
});
