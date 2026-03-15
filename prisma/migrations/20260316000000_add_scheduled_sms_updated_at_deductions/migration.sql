-- AlterTable: add updated_at and deductions to scheduled_sms
ALTER TABLE "scheduled_sms" ADD COLUMN IF NOT EXISTS "deductions" JSONB;
ALTER TABLE "scheduled_sms" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
