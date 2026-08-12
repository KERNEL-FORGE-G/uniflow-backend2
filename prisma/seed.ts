import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faculty = await prisma.faculty.create({
    data: { name: "Faculté des Sciences" },
  });

  const department = await prisma.department.create({
    data: {
      name: "Département d'Informatique",
      facultyId: faculty.id,
    },
  });

  const program = await prisma.program.create({
    data: {
      name: "Licence Informatique",
      departmentId: department.id,
    },
  });

  const level = await prisma.level.create({
    data: {
      name: "Licence 1",
      programId: program.id,
    },
  });

  const semester = await prisma.semester.create({
    data: {
      name: "Semestre 1 - 2026/2027",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-01-31"),
      isActive: true,
    },
  });

  const [level1, level2, level3] = await Promise.all([
    prisma.level.create({ data: { name: "Licence 1", programId: program.id } }),
    prisma.level.create({ data: { name: "Licence 2", programId: program.id } }),
    prisma.level.create({ data: { name: "Licence 3", programId: program.id } }),
  ]);

  const infoL1Specialty = await prisma.specialty.create({ data: { name: 'Informatique', levelId: level1.id } });
  const infoL2Specialty = await prisma.specialty.create({ data: { name: 'Informatique', levelId: level2.id } });
  const glL2Specialty = await prisma.specialty.create({ data: { name: 'Génie Logiciel', levelId: level2.id } });
  const infoL3Specialty = await prisma.specialty.create({ data: { name: 'Informatique', levelId: level3.id } });
  const rtL3Specialty = await prisma.specialty.create({ data: { name: 'Réseaux et Télécommunications', levelId: level3.id } });

  const [classroomA, classroomTd, classroomLab] = await Promise.all([
    prisma.classroom.create({
      data: { name: 'Amphi A', building: 'Bâtiment A', capacity: 250, type: 'AMPHITHEATRE' },
    }),
    prisma.classroom.create({
      data: { name: 'Salle TD 101', building: 'Bâtiment B', capacity: 40, type: 'SALLE_TD' },
    }),
    prisma.classroom.create({
      data: { name: 'Laboratoire 202', building: 'Bâtiment C', capacity: 24, type: 'LABORATOIRE' },
    }),
  ]);

  const teacherUser = await prisma.user.create({
    data: {
      email: 'seed.teacher@uniflow.io',
      passwordHash: 'seeded-password',
      role: 'ENSEIGNANT',
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      firstName: 'Prof',
      lastName: 'Seed',
    },
  });

  const [ue1, ue2, ue3, ue4, ue5] = await Promise.all([
    prisma.teachingUnit.create({
      data: {
        code: 'INF101',
        name: 'Algorithmes et Programmation',
        credits: 4,
        hoursCM: 30,
        hoursTD: 15,
        hoursTP: 10,
        type: 'OBLIGATOIRE',
        levelId: level1.id,
        semesterId: semester.id,
        specialties: {
          create: [{ specialtyId: infoL1Specialty.id }],
        },
      },
    }),
    prisma.teachingUnit.create({
      data: {
        code: 'INF102',
        name: 'Mathématiques Discrètes',
        credits: 3,
        hoursCM: 24,
        hoursTD: 12,
        hoursTP: 0,
        type: 'OBLIGATOIRE',
        levelId: level1.id,
        semesterId: semester.id,
        specialties: {
          create: [{ specialtyId: infoL1Specialty.id }],
        },
      },
    }),
    prisma.teachingUnit.create({
      data: {
        code: 'INF201',
        name: 'Structures de Données',
        credits: 4,
        hoursCM: 30,
        hoursTD: 15,
        hoursTP: 5,
        type: 'OBLIGATOIRE',
        levelId: level2.id,
        semesterId: semester.id,
        specialties: {
          create: [
            { specialtyId: infoL2Specialty.id },
            { specialtyId: glL2Specialty.id },
          ],
        },
      },
    }),
    prisma.teachingUnit.create({
      data: {
        code: 'INF202',
        name: 'Bases de Données',
        credits: 4,
        hoursCM: 28,
        hoursTD: 14,
        hoursTP: 10,
        type: 'OBLIGATOIRE',
        levelId: level2.id,
        semesterId: semester.id,
        specialties: {
          create: [
            { specialtyId: infoL2Specialty.id },
            { specialtyId: glL2Specialty.id },
          ],
        },
      },
    }),
    prisma.teachingUnit.create({
      data: {
        code: 'INF301',
        name: 'Réseaux et Télécommunications',
        credits: 4,
        hoursCM: 26,
        hoursTD: 14,
        hoursTP: 10,
        type: 'OBLIGATOIRE',
        levelId: level3.id,
        semesterId: semester.id,
        specialties: {
          create: [
            { specialtyId: infoL3Specialty.id },
            { specialtyId: rtL3Specialty.id },
          ],
        },
      },
    }),
  ]);

  const [course1, course2, course3] = await Promise.all([
    prisma.course.create({
      data: {
        teachingUnitId: ue1.id,
        teacherId: teacher.id,
        classroomId: classroomA.id,
        type: 'CM',
        groupLabel: 'G1',
      },
    }),
    prisma.course.create({
      data: {
        teachingUnitId: ue3.id,
        teacherId: teacher.id,
        classroomId: classroomTd.id,
        type: 'TD',
        groupLabel: 'G2',
      },
    }),
    prisma.course.create({
      data: {
        teachingUnitId: ue5.id,
        teacherId: teacher.id,
        classroomId: classroomLab.id,
        type: 'TP',
        groupLabel: 'G3',
      },
    }),
  ]);

  await Promise.all([
    prisma.schedule.create({
      data: {
        courseId: course1.id,
        dayOfWeek: 'LUNDI',
        startTime: '08:00',
        endTime: '10:00',
      },
    }),
    prisma.schedule.create({
      data: {
        courseId: course2.id,
        dayOfWeek: 'MERCREDI',
        startTime: '10:00',
        endTime: '12:00',
      },
    }),
    prisma.schedule.create({
      data: {
        courseId: course3.id,
        dayOfWeek: 'VENDREDI',
        startTime: '14:00',
        endTime: '16:00',
      },
    }),
  ]);

  console.log('✅ Données de test créées :');
  console.log('Faculty ID:', faculty.id);
  console.log('Department ID:', department.id);
  console.log('Program ID:', program.id);
  console.log('Levels:', level1.id, level2.id, level3.id);
  console.log('Semester ID:', semester.id);
  console.log('Teacher ID:', teacher.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });