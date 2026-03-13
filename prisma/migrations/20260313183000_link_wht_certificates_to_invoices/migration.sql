ALTER TABLE "wht_certificates"
  ADD COLUMN IF NOT EXISTS "invoice_id" TEXT;

UPDATE "wht_certificates" AS wc
SET "invoice_id" = i."id"
FROM "invoices" AS i
WHERE wc."invoice_id" IS NULL
  AND wc."transaction_id" IS NOT NULL
  AND i."transaction_id" = wc."transaction_id";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'wht_certificates_invoice_id_fkey'
  ) THEN
    ALTER TABLE "wht_certificates"
      ADD CONSTRAINT "wht_certificates_invoice_id_fkey"
      FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "wht_certificates_invoice_id_idx"
  ON "wht_certificates"("invoice_id");
