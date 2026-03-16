ALTER TABLE "message_templates"
  DROP CONSTRAINT IF EXISTS "message_templates_user_id_name_deleted_at_key";

DROP INDEX IF EXISTS "message_templates_user_id_name_deleted_at_key";

CREATE UNIQUE INDEX IF NOT EXISTS "message_templates_user_id_name_live_key"
  ON "message_templates"("user_id", "name")
  WHERE "deleted_at" IS NULL;
