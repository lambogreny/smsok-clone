DO $$
BEGIN
  ALTER TYPE "DocumentType" ADD VALUE IF NOT EXISTS 'ORDER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OrderCustomerType" AS ENUM ('INDIVIDUAL', 'COMPANY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OrderBranchType" AS ENUM ('HEAD', 'BRANCH');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "OrderStatus" AS ENUM (
    'PENDING',
    'SLIP_UPLOADED',
    'VERIFIED',
    'PENDING_REVIEW',
    'APPROVED',
    'COMPLETED',
    'EXPIRED',
    'CANCELLED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "organization_id" TEXT,
  "package_tier_id" TEXT NOT NULL,
  "tax_profile_id" TEXT,
  "order_number" TEXT NOT NULL,
  "customer_type" "OrderCustomerType" NOT NULL,
  "package_name" TEXT NOT NULL,
  "sms_count" INTEGER NOT NULL,
  "tax_name" TEXT NOT NULL,
  "tax_id" TEXT NOT NULL,
  "tax_address" TEXT NOT NULL,
  "tax_branch_type" "OrderBranchType" NOT NULL,
  "tax_branch_number" TEXT,
  "net_amount" DECIMAL(12,2) NOT NULL,
  "vat_amount" DECIMAL(12,2) NOT NULL,
  "total_amount" DECIMAL(12,2) NOT NULL,
  "has_wht" BOOLEAN NOT NULL DEFAULT false,
  "wht_amount" DECIMAL(12,2) NOT NULL,
  "pay_amount" DECIMAL(12,2) NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "quotation_number" TEXT,
  "quotation_url" TEXT,
  "invoice_number" TEXT,
  "invoice_url" TEXT,
  "credit_note_number" TEXT,
  "credit_note_url" TEXT,
  "debit_note_number" TEXT,
  "debit_note_url" TEXT,
  "slip_url" TEXT,
  "slip_file_name" TEXT,
  "slip_file_size" INTEGER,
  "easyslip_verified" BOOLEAN,
  "easyslip_response" JSONB,
  "wht_cert_url" TEXT,
  "wht_cert_verified" BOOLEAN,
  "admin_note" TEXT,
  "reject_reason" TEXT,
  "reviewed_by" TEXT,
  "reviewed_at" TIMESTAMP(3),
  "paid_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_history" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "from_status" "OrderStatus",
  "to_status" "OrderStatus" NOT NULL,
  "changed_by" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_package_tier_id_fkey"
    FOREIGN KEY ("package_tier_id") REFERENCES "package_tiers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_tax_profile_id_fkey"
    FOREIGN KEY ("tax_profile_id") REFERENCES "tax_profiles"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "order_history"
    ADD CONSTRAINT "order_history_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_order_number_key" ON "orders"("order_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_quotation_number_key" ON "orders"("quotation_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_invoice_number_key" ON "orders"("invoice_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_credit_note_number_key" ON "orders"("credit_note_number");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_debit_note_number_key" ON "orders"("debit_note_number");
CREATE INDEX IF NOT EXISTS "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "orders_organization_id_created_at_idx" ON "orders"("organization_id", "created_at");
CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx" ON "orders"("status", "created_at");
CREATE INDEX IF NOT EXISTS "orders_package_tier_id_idx" ON "orders"("package_tier_id");
CREATE INDEX IF NOT EXISTS "orders_expires_at_idx" ON "orders"("expires_at");
CREATE INDEX IF NOT EXISTS "orders_pending_expire_idx" ON "orders"("expires_at") WHERE "status" = 'PENDING';
CREATE INDEX IF NOT EXISTS "order_history_order_id_created_at_idx" ON "order_history"("order_id", "created_at");
