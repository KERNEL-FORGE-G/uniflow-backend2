-- CreateEnum
CREATE TYPE "ConferenceMode" AS ENUM ('LAN', 'INTERNET');

-- CreateEnum
CREATE TYPE "ConferenceStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "video_conferences" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "courseId" TEXT,
    "apiKey" TEXT NOT NULL,
    "apiSecretEncrypted" TEXT NOT NULL,
    "mode" "ConferenceMode" NOT NULL DEFAULT 'LAN',
    "status" "ConferenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "localUrl" TEXT,
    "publicUrl" TEXT,
    "maxParticipants" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_conferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conference_participants" (
    "id" TEXT NOT NULL,
    "conferenceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "conference_participants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "video_conferences" ADD CONSTRAINT "video_conferences_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_participants" ADD CONSTRAINT "conference_participants_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "video_conferences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conference_participants" ADD CONSTRAINT "conference_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
