/**
 * Data Migration: Single-user → Multi-tenant
 *
 * Creates an Organization for each existing User,
 * assigns them as OWNER, copies credits,
 * and backfills organizationId on all related records.
 *
 * Usage: npx tsx prisma/migrate-to-multitenant.ts
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const db = new PrismaClient();

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "org"}-${suffix}`;
}

async function main() {
  console.log("🔄 Starting multi-tenant migration...\n");

  const users = await db.user.findMany({
    select: { id: true, name: true, email: true },
  });

  console.log(`Found ${users.length} users to migrate.\n`);

  for (const user of users) {
    // Check if user already has an org (idempotent)
    const existingMembership = await db.membership.findFirst({
      where: { userId: user.id, role: "OWNER" },
      include: { organization: true },
    });

    let orgId: string;

    if (existingMembership) {
      orgId = existingMembership.organizationId;
      console.log(`⏭ User ${user.email} already has org: ${existingMembership.organization.name}`);
    } else {
      // Create org
      const orgName = user.name ? `${user.name}` : `${user.email.split("@")[0]}`;
      const org = await db.organization.create({
        data: {
          name: orgName,
          slug: generateSlug(orgName),
        },
      });

      await db.membership.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "OWNER",
        },
      });

      orgId = org.id;
      console.log(`✅ Created org "${orgName}" for ${user.email}`);
    }

    // Backfill organizationId on all related records
    const tables = [
      { model: "message", field: "userId" },
      { model: "contact", field: "userId" },
      { model: "apiKey", field: "userId" },
      { model: "campaign", field: "userId" },
      { model: "tag", field: "userId" },
      { model: "contactGroup", field: "userId" },
      { model: "senderName", field: "userId" },
      { model: "messageTemplate", field: "userId" },
      { model: "scheduledSms", field: "userId" },
      { model: "customField", field: "userId" },
      { model: "invoice", field: "userId" },
      { model: "transaction", field: "userId" },
      { model: "taxDocument", field: "userId" },
      { model: "whtCertificate", field: "userId" },
      { model: "webhook", field: "userId" },
    ] as const;

    for (const table of tables) {
      // Use raw SQL for bulk update (Prisma updateMany doesn't support conditional)
      const tableName = getTableName(table.model);
      const result = await db.$executeRawUnsafe(
        `UPDATE "${tableName}" SET organization_id = $1 WHERE user_id = $2 AND organization_id IS NULL`,
        orgId,
        user.id
      );
      if (result > 0) {
        console.log(`   ↳ Updated ${result} ${table.model} records`);
      }
    }
  }

  console.log("\n✅ Migration complete!");
}

function getTableName(model: string): string {
  const map: Record<string, string> = {
    message: "messages",
    contact: "contacts",
    apiKey: "api_keys",
    campaign: "campaigns",
    tag: "tags",
    contactGroup: "contact_groups",
    senderName: "sender_names",
    messageTemplate: "message_templates",
    scheduledSms: "scheduled_sms",
    customField: "custom_fields",
    invoice: "invoices",
    transaction: "transactions",
    taxDocument: "tax_documents",
    whtCertificate: "wht_certificates",
    webhook: "webhooks",
  };
  return map[model] || model;
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
