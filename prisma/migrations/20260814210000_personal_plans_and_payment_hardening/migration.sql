-- UniFlow Backend 2: plans PERSONAL persistés et paiement honnête.
-- Cette migration est incrémentale : elle conserve toutes les données existantes.

ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING';

CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthlyXaf" DECIMAL(10,2) NOT NULL,
    "priceAnnuallyXaf" DECIMAL(10,2) NOT NULL,
    "priceMonthlyEur" DECIMAL(10,2) NOT NULL,
    "priceAnnuallyEur" DECIMAL(10,2) NOT NULL,
    "period" TEXT,
    "features" JSONB NOT NULL,
    "providers" "PaymentProvider"[] NOT NULL DEFAULT ARRAY[]::"PaymentProvider"[],
    "btnText" TEXT,
    "btnVariant" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "badge" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

ALTER TABLE "subscriptions" ADD COLUMN "planCode" TEXT;

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_planCode_fkey"
  FOREIGN KEY ("planCode") REFERENCES "subscription_plans"("code")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_transactions"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';
