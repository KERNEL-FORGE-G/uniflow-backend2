-- UniFlow — Backend indépendant / Neon
-- Fichier idempotent pour la base `neondb` du projet `uniflow-backend2`.
-- Ne crée aucun compte PERSONAL, aucune matière, aucune note, aucune tâche et aucun planning.
-- Les seuls enregistrements insérés sont les deux plans d’abonnement nécessaires au catalogue public.
-- À exécuter uniquement sur la base Neon du backend indépendant, jamais sur la base universitaire.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE "PersonalUserRole" AS ENUM ('INDEPENDENT_STUDENT','INDEPENDENT_TEACHER','TUTOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING','TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentCurrency" AS ENUM ('XAF','EUR','USD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "PaymentProvider" AS ENUM ('CINETPAY','NOTCHPAY','MTN_MOMO','ORANGE_MONEY','STRIPE','CARD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "DayOfWeek" AS ENUM ('LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI','DIMANCHE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaskPriority" AS ENUM ('LOW','MEDIUM','HIGH'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE "TaskStatus" AS ENUM ('TODO','IN_PROGRESS','COMPLETED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Compatibilité avec une base où l’enum existait déjà sans PENDING.
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING';

CREATE TABLE IF NOT EXISTS personal_users (
  id text PRIMARY KEY DEFAULT ('pusr_' || gen_random_uuid()::text),
  email text NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  "firstName" text NOT NULL,
  "lastName" text NOT NULL,
  role "PersonalUserRole" NOT NULL DEFAULT 'INDEPENDENT_STUDENT',
  phone text,
  "avatarUrl" text,
  "countryCode" varchar(5) NOT NULL DEFAULT 'CM',
  "preferredCurrency" "PaymentCurrency" NOT NULL DEFAULT 'XAF',
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  "priceMonthlyXaf" numeric(10,2) NOT NULL,
  "priceAnnuallyXaf" numeric(10,2) NOT NULL,
  "priceMonthlyEur" numeric(10,2) NOT NULL,
  "priceAnnuallyEur" numeric(10,2) NOT NULL,
  period text,
  features jsonb NOT NULL,
  providers "PaymentProvider"[] NOT NULL DEFAULT ARRAY['NOTCHPAY'::"PaymentProvider"],
  "btnText" text,
  "btnVariant" text,
  highlight boolean NOT NULL DEFAULT false,
  badge text,
  "isActive" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id text PRIMARY KEY DEFAULT ('sub_' || gen_random_uuid()::text),
  "userId" text NOT NULL UNIQUE REFERENCES personal_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "planCode" text REFERENCES subscription_plans(code) ON UPDATE CASCADE ON DELETE SET NULL,
  status "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
  "countryCode" varchar(5) NOT NULL DEFAULT 'CM',
  currency "PaymentCurrency" NOT NULL DEFAULT 'XAF',
  "monthlyAmount" numeric(10,2) NOT NULL DEFAULT 100.00,
  "currentPeriodStart" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false,
  "paymentProvider" "PaymentProvider" DEFAULT 'NOTCHPAY',
  "externalSubscriptionId" text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_subjects (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text NOT NULL REFERENCES personal_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  "instructorName" text,
  credits integer DEFAULT 3,
  "colorHex" text DEFAULT '#1e3a8a',
  "semesterLabel" text DEFAULT 'Semestre 1',
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_schedules (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text NOT NULL REFERENCES personal_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "subjectId" text NOT NULL REFERENCES personal_subjects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "startTime" text NOT NULL,
  "endTime" text NOT NULL,
  "classroomLocation" text,
  notes text,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_grades (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text NOT NULL REFERENCES personal_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "subjectId" text NOT NULL REFERENCES personal_subjects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "evaluationTitle" text NOT NULL,
  score numeric(4,2) NOT NULL,
  "maxScore" numeric(4,2) NOT NULL DEFAULT 20.00,
  coefficient numeric(3,2) NOT NULL DEFAULT 1.00,
  "evaluationDate" date,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personal_tasks (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" text NOT NULL REFERENCES personal_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "subjectId" text REFERENCES personal_subjects(id) ON UPDATE CASCADE ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  "dueDate" timestamp without time zone,
  priority "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  status "TaskStatus" NOT NULL DEFAULT 'TODO',
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subscriptionId" text NOT NULL REFERENCES subscriptions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  "userId" text NOT NULL REFERENCES personal_users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  currency "PaymentCurrency" NOT NULL,
  provider "PaymentProvider" NOT NULL,
  "providerTransactionRef" text,
  status text NOT NULL DEFAULT 'PENDING',
  metadata jsonb,
  "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Complément idempotent pour les bases déjà partiellement migrées.
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS "avatarUrl" text;
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS "countryCode" varchar(5) NOT NULL DEFAULT 'CM';
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS "preferredCurrency" "PaymentCurrency" NOT NULL DEFAULT 'XAF';
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true;
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS "createdAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE personal_users ADD COLUMN IF NOT EXISTS "updatedAt" timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS "planCode" text;
ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'PENDING';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_planCode_fkey') THEN
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_planCode_fkey FOREIGN KEY ("planCode") REFERENCES subscription_plans(code) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_personal_subjects_user ON personal_subjects("userId");
CREATE INDEX IF NOT EXISTS idx_personal_schedules_user ON personal_schedules("userId");
CREATE INDEX IF NOT EXISTS idx_personal_schedules_subject ON personal_schedules("subjectId");
CREATE INDEX IF NOT EXISTS idx_personal_grades_user ON personal_grades("userId");
CREATE INDEX IF NOT EXISTS idx_personal_grades_subject ON personal_grades("subjectId");
CREATE INDEX IF NOT EXISTS idx_personal_tasks_user ON personal_tasks("userId");
CREATE INDEX IF NOT EXISTS idx_personal_tasks_subject ON personal_tasks("subjectId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions("userId");

-- Plans réels du catalogue. Aucun contenu académique n’est créé pour les utilisateurs.
INSERT INTO subscription_plans (code,name,category,description,"priceMonthlyXaf","priceAnnuallyXaf","priceMonthlyEur","priceAnnuallyEur",period,features,providers,"btnText","btnVariant",highlight,badge,"isActive")
VALUES ('pass-etudiant','Pass Étudiant','PERSONAL','Organisation personnelle pour étudiants indépendants.',100.00,1000.00,1.00,10.00,'monthly','["Cours","Planning","Tâches","Notes"]'::jsonb,ARRAY['NOTCHPAY'::"PaymentProvider"],'Choisir le pass','primary',true,'Recommandé',true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description, "priceMonthlyXaf"=EXCLUDED."priceMonthlyXaf", "priceAnnuallyXaf"=EXCLUDED."priceAnnuallyXaf", "priceMonthlyEur"=EXCLUDED."priceMonthlyEur", "priceAnnuallyEur"=EXCLUDED."priceAnnuallyEur", period=EXCLUDED.period, features=EXCLUDED.features, providers=EXCLUDED.providers, "btnText"=EXCLUDED."btnText", "btnVariant"=EXCLUDED."btnVariant", highlight=EXCLUDED.highlight, badge=EXCLUDED.badge, "isActive"=EXCLUDED."isActive", "updatedAt"=CURRENT_TIMESTAMP;

INSERT INTO subscription_plans (code,name,category,description,"priceMonthlyXaf","priceAnnuallyXaf","priceMonthlyEur","priceAnnuallyEur",period,features,providers,"btnText","btnVariant",highlight,badge,"isActive")
VALUES ('enseignant-pro','Enseignant Pro','PERSONAL','Outils avancés de suivi pédagogique personnel.',500.00,5000.00,3.00,30.00,'monthly','["Cours","Planning","Tâches","Notes","Suivi pédagogique"]'::jsonb,ARRAY['NOTCHPAY'::"PaymentProvider"],'Choisir l’offre','secondary',false,NULL,true)
ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, description=EXCLUDED.description, "priceMonthlyXaf"=EXCLUDED."priceMonthlyXaf", "priceAnnuallyXaf"=EXCLUDED."priceAnnuallyXaf", "priceMonthlyEur"=EXCLUDED."priceMonthlyEur", "priceAnnuallyEur"=EXCLUDED."priceAnnuallyEur", period=EXCLUDED.period, features=EXCLUDED.features, providers=EXCLUDED.providers, "btnText"=EXCLUDED."btnText", "btnVariant"=EXCLUDED."btnVariant", highlight=EXCLUDED.highlight, badge=EXCLUDED.badge, "isActive"=EXCLUDED."isActive", "updatedAt"=CURRENT_TIMESTAMP;

-- Vérifications non destructives à exécuter après migration.
-- SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
-- SELECT code,name,category,"priceMonthlyXaf","priceMonthlyEur","isActive" FROM subscription_plans ORDER BY code;
-- SELECT id,(SELECT count(*) FROM personal_subjects s WHERE s."userId"=u.id) subjects,(SELECT count(*) FROM personal_schedules s WHERE s."userId"=u.id) schedules,(SELECT count(*) FROM personal_tasks t WHERE t."userId"=u.id) tasks,(SELECT count(*) FROM personal_grades g WHERE g."userId"=u.id) grades FROM personal_users u;
