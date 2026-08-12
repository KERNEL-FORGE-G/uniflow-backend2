-- CreateEnum
CREATE TYPE "UEType" AS ENUM ('OBLIGATOIRE', 'OPTIONNELLE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateTable
CREATE TABLE "semesters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_units" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "credits" INTEGER NOT NULL,
    "hoursCM" INTEGER NOT NULL DEFAULT 0,
    "hoursTD" INTEGER NOT NULL DEFAULT 0,
    "hoursTP" INTEGER NOT NULL DEFAULT 0,
    "type" "UEType" NOT NULL DEFAULT 'OBLIGATOIRE',
    "levelId" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "teaching_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ue_specialties" (
    "teachingUnitId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,

    CONSTRAINT "ue_specialties_pkey" PRIMARY KEY ("teachingUnitId","specialtyId")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teachingUnitId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_ue_assignments" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "teachingUnitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_ue_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teaching_units_code_key" ON "teaching_units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_teachingUnitId_key" ON "enrollments"("studentId", "teachingUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_ue_assignments_teacherId_teachingUnitId_key" ON "teacher_ue_assignments"("teacherId", "teachingUnitId");

-- AddForeignKey
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_units" ADD CONSTRAINT "teaching_units_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ue_specialties" ADD CONSTRAINT "ue_specialties_teachingUnitId_fkey" FOREIGN KEY ("teachingUnitId") REFERENCES "teaching_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ue_specialties" ADD CONSTRAINT "ue_specialties_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_teachingUnitId_fkey" FOREIGN KEY ("teachingUnitId") REFERENCES "teaching_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_ue_assignments" ADD CONSTRAINT "teacher_ue_assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_ue_assignments" ADD CONSTRAINT "teacher_ue_assignments_teachingUnitId_fkey" FOREIGN KEY ("teachingUnitId") REFERENCES "teaching_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
