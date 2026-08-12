const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();
(async () => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, isActive: true }, take: 20 });
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.level.count(),
      prisma.specialty.count(),
      prisma.notification.count(),
    ]);
    console.log('users', users.length, users);
    console.log('counts', {
      users: counts[0],
      students: counts[1],
      teachers: counts[2],
      levels: counts[3],
      specialties: counts[4],
      notifications: counts[5],
    });
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
