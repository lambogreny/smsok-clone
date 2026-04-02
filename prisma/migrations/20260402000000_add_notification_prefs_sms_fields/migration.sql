-- Add missing notification preference columns
ALTER TABLE "notification_prefs"
  ADD COLUMN IF NOT EXISTS "sms_weekly_report"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "email_api_error"      BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "sms_api_error"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sms_security_alert"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sms_package_expiry"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sms_invoice"          BOOLEAN NOT NULL DEFAULT false;
