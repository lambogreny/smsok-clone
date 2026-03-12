-- Purchase Package v2 / billing support
-- Defensive migration for existing payment-based environments.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocumentType') THEN
    CREATE TYPE "DocumentType" AS ENUM (
      'TAX_INVOICE',
      'RECEIPT',
      'TAX_INVOICE_RECEIPT',
      'INVOICE',
      'DEBIT_NOTE',
      'CREDIT_NOTE',
      'QUOTATION'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tax_profiles (
  id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  address TEXT NOT NULL,
  branch_type TEXT NOT NULL DEFAULT 'HEAD',
  branch_number TEXT,
  is_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.payment_history (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.document_sequences (
  id TEXT PRIMARY KEY,
  type "DocumentType" NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS wht_amount INTEGER;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS net_pay_amount INTEGER;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS has_wht BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS wht_cert_url TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS wht_cert_verified BOOLEAN;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS tax_profile_id TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pre_invoice_number TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS pre_invoice_url TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS credit_note_number TEXT;
    ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS credit_note_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_profiles')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tax_profiles_user_id_fkey') THEN
    ALTER TABLE public.tax_profiles
      ADD CONSTRAINT tax_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_profiles')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tax_profiles_organization_id_fkey') THEN
    ALTER TABLE public.tax_profiles
      ADD CONSTRAINT tax_profiles_organization_id_fkey
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_history')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_history_payment_id_fkey') THEN
    ALTER TABLE public.payment_history
      ADD CONSTRAINT payment_history_payment_id_fkey
      FOREIGN KEY (payment_id) REFERENCES public.payments(id)
      ON UPDATE CASCADE ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_profiles')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_tax_profile_id_fkey') THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_tax_profile_id_fkey
      FOREIGN KEY (tax_profile_id) REFERENCES public.tax_profiles(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_expires
  ON public.payments (expires_at)
  WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_tax_profile_org
  ON public.tax_profiles (organization_id);

CREATE INDEX IF NOT EXISTS idx_tax_profile_user
  ON public.tax_profiles (user_id);

CREATE INDEX IF NOT EXISTS payment_history_payment_id_created_at_idx
  ON public.payment_history (payment_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS document_sequences_type_year_key
  ON public.document_sequences (type, year);
