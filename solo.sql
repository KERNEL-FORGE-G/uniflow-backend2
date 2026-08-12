-- ==============================================================================
-- UNIFLOW - BACKEND 2 : INDÉPENDANTS / SAAS AUTO-GÉRÉ (POSTGRESQL - VERCEL)
-- Version: 1.0 (Complet pour les étudiants & enseignants autonomes)
-- Description: Ce script régit le backend du modèle abonnement SaaS UniFlow.
--              Les comptes gèrent leurs propres cours, emplois du temps et notes,
--              avec facturation géolocalisée (100 FCFA/mois au Cameroun, 1€/mois ailleurs).
-- ==============================================================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS (BACKEND SAAS PERSONNEL)
-- ------------------------------------------------------------------------------
CREATE TYPE "AccountType" AS ENUM ('PERSONAL');
CREATE TYPE "PersonalUserRole" AS ENUM ('INDEPENDENT_STUDENT', 'INDEPENDENT_TEACHER', 'TUTOR');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');
CREATE TYPE "PaymentCurrency" AS ENUM ('XAF', 'EUR', 'USD');
CREATE TYPE "PaymentProvider" AS ENUM ('CINETPAY', 'NOTCHPAY', 'MTN_MOMO', 'ORANGE_MONEY', 'STRIPE', 'CARD');
CREATE TYPE "DayOfWeek" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- ------------------------------------------------------------------------------
-- 2. UTILISATEURS INDÉPENDANTS
-- ------------------------------------------------------------------------------
CREATE TABLE "personal_users" (
    "id" TEXT NOT NULL DEFAULT ('pusr_' || gen_random_uuid()),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "PersonalUserRole" NOT NULL DEFAULT 'INDEPENDENT_STUDENT',
    "phone" TEXT,
    "avatarUrl" TEXT,
    "countryCode" VARCHAR(5) NOT NULL DEFAULT 'CM', -- 'CM' pour Cameroun, 'FR', 'CA', etc.
    "preferredCurrency" "PaymentCurrency" NOT NULL DEFAULT 'XAF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "personal_users_email_key" ON "personal_users"("email");

-- ------------------------------------------------------------------------------
-- 3. ABONNEMENTS ET PAIEMENTS (TARIFICATION SAAS)
-- ------------------------------------------------------------------------------
-- Tarifs :
--   • Cameroun ('CM') : 100 FCFA / mois (Mobile Money, Orange Money)
--   • International  : 1.00 € / mois (Stripe / Carte Bancaire)
---------------------------------------------------------------------------------
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL DEFAULT ('sub_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
    "countryCode" VARCHAR(5) NOT NULL DEFAULT 'CM',
    "currency" "PaymentCurrency" NOT NULL DEFAULT 'XAF',
    "monthlyAmount" NUMERIC(10, 2) NOT NULL DEFAULT 100.00, -- 100 XAF ou 1.00 EUR
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "paymentProvider" "PaymentProvider" DEFAULT 'NOTCHPAY',
    "externalSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_userId_key" ON "subscriptions"("userId");

CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL DEFAULT ('tx_' || gen_random_uuid()),
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" NUMERIC(10, 2) NOT NULL,
    "currency" "PaymentCurrency" NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerTransactionRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS', -- 'PENDING', 'SUCCESS', 'FAILED'
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------------------------
-- 4. DONNÉES ACADÉMIQUES MANUELLES (AUTONOMES)
-- ------------------------------------------------------------------------------

-- 4.1 MATIÈRES MANUELLES
CREATE TABLE "personal_subjects" (
    "id" TEXT NOT NULL DEFAULT ('psub_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,             -- ex: 'INF201'
    "name" TEXT NOT NULL,             -- ex: 'Bases de Données'
    "instructorName" TEXT,           -- ex: 'Dr. Benkacem'
    "credits" INTEGER DEFAULT 3,
    "colorHex" TEXT DEFAULT '#1e3a8a', -- Couleur d'affichage sur l'emploi du temps
    "semesterLabel" TEXT DEFAULT 'Semestre 1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_subjects_pkey" PRIMARY KEY ("id")
);

-- 4.2 EMPLOI DU TEMPS PERSONNEL
CREATE TABLE "personal_schedules" (
    "id" TEXT NOT NULL DEFAULT ('psch_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TIME NOT NULL,        -- ex: '08:00:00'
    "endTime" TIME NOT NULL,          -- ex: '10:00:00'
    "classroomLocation" TEXT,         -- ex: 'Salle A204'
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_schedules_pkey" PRIMARY KEY ("id")
);

-- 4.3 NOTES ET MOYENNES
CREATE TABLE "personal_grades" (
    "id" TEXT NOT NULL DEFAULT ('pgrd_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "evaluationTitle" TEXT NOT NULL,  -- ex: 'Contrôle Continu 1', 'Examen Final'
    "score" NUMERIC(4, 2) NOT NULL,    -- ex: 16.50
    "maxScore" NUMERIC(4, 2) NOT NULL DEFAULT 20.00,
    "coefficient" NUMERIC(3, 2) NOT NULL DEFAULT 1.00, -- Coefficient dans la matière
    "evaluationDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_grades_pkey" PRIMARY KEY ("id")
);

-- 4.4 TÂCHES & RAPPELS DE RÉVISION
CREATE TABLE "personal_tasks" (
    "id" TEXT NOT NULL DEFAULT ('ptsk_' || gen_random_uuid()),
    "userId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personal_tasks_pkey" PRIMARY KEY ("id")
);

-- ------------------------------------------------------------------------------
-- 5. CONTRAINTES & CLÉS ÉTRANGÈRES
-- ------------------------------------------------------------------------------
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "personal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "personal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "personal_subjects" ADD CONSTRAINT "personal_subjects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "personal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_schedules" ADD CONSTRAINT "personal_schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "personal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_schedules" ADD CONSTRAINT "personal_schedules_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "personal_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "personal_grades" ADD CONSTRAINT "personal_grades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "personal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_grades" ADD CONSTRAINT "personal_grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "personal_subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "personal_tasks" ADD CONSTRAINT "personal_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "personal_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personal_tasks" ADD CONSTRAINT "personal_tasks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "personal_subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------------------------
-- 6. INDEX DE PERFORMANCE
-- ------------------------------------------------------------------------------
CREATE INDEX "idx_personal_schedules_user" ON "personal_schedules"("userId");
CREATE INDEX "idx_personal_grades_user" ON "personal_grades"("userId");
CREATE INDEX "idx_personal_subjects_user" ON "personal_subjects"("userId");
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- ------------------------------------------------------------------------------
-- 7. SEED DATA (EXEMPLE INDÉPENDANT)
-- ------------------------------------------------------------------------------
-- Utilisateur Camerounais (100 FCFA/mois)
INSERT INTO "personal_users" ("id", "email", "passwordHash", "firstName", "lastName", "countryCode", "preferredCurrency") VALUES
('pusr_cm_1', 'jean.independant@gmail.com', '$2a$10$wK1m...encrypted', 'Jean', 'Nguea', 'CM', 'XAF');

INSERT INTO "subscriptions" ("id", "userId", "status", "countryCode", "currency", "monthlyAmount", "paymentProvider") VALUES
('sub_cm_1', 'pusr_cm_1', 'ACTIVE', 'CM', 'XAF', 100.00, 'NOTCHPAY');

INSERT INTO "personal_subjects" ("id", "userId", "code", "name", "instructorName", "credits", "colorHex") VALUES
('psub_1', 'pusr_cm_1', 'MAT201', 'Analyse Numérique', 'Prof. Mbarga', 4, '#2563eb'),
('psub_2', 'pusr_cm_1', 'INF204', 'Structures de Données C++', 'Dr. Etoa', 3, '#10b981');

INSERT INTO "personal_schedules" ("id", "userId", "subjectId", "dayOfWeek", "startTime", "endTime", "classroomLocation") VALUES
('psch_1', 'pusr_cm_1', 'psub_1', 'LUNDI', '08:00:00', '10:00:00', 'Amphi 300'),
('psch_2', 'pusr_cm_1', 'psub_2', 'MARDI', '10:00:00', '12:00:00', 'Labo Info 1');

INSERT INTO "personal_grades" ("id", "userId", "subjectId", "evaluationTitle", "score", "coefficient") VALUES
('pgrd_1', 'pusr_cm_1', 'psub_1', 'CC 1', 14.50, 0.30),
('pgrd_2', 'pusr_cm_1', 'psub_2', 'TP C++', 17.00, 0.40);

-- Utilisateur International (1.00 €/mois)
INSERT INTO "personal_users" ("id", "email", "passwordHash", "firstName", "lastName", "countryCode", "preferredCurrency") VALUES
('pusr_fr_1', 'sophie.etudiante@gmail.com', '$2a$10$wK1m...encrypted', 'Sophie', 'Moreau', 'FR', 'EUR');

INSERT INTO "subscriptions" ("id", "userId", "status", "countryCode", "currency", "monthlyAmount", "paymentProvider") VALUES
('sub_fr_1', 'pusr_fr_1', 'ACTIVE', 'FR', 'EUR', 1.00, 'STRIPE');

