import { PrismaClient } from "@prisma/client";

async function hashPassword(password: string) {
  return Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 19456, timeCost: 2 });
}

const prisma = new PrismaClient();

const SEED_MESSAGE_PREFIX = "[smsok-seed]";
const DEFAULT_SEED_EMAIL = "demo@smsok.local";
const DEFAULT_SEED_PHONE = "+66900000000";
const DEFAULT_SEED_PASSWORD = "Password123!";
const DEFAULT_SEED_NAME = "Demo User";
const DEFAULT_ADMIN_SEED_PASSWORD = "admin1234";

async function resolveSeedUser() {
  const requestedEmail = process.env.SEED_EMAIL?.trim();
  const requestedPhone = process.env.SEED_PHONE?.trim() || DEFAULT_SEED_PHONE;
  if (requestedEmail) {
    const existing = await prisma.user.findUnique({
      where: { email: requestedEmail },
    });
    if (existing) {
      return existing;
    }

    const password = await hashPassword(process.env.SEED_PASSWORD || DEFAULT_SEED_PASSWORD);
    return prisma.user.create({
      data: {
        email: requestedEmail,
        name: requestedEmail.split("@")[0],
        phone: requestedPhone,
        password,
      },
    });
  }

  const firstUser = await prisma.user.findFirst({
    where: { role: "user" },
    orderBy: { createdAt: "asc" },
  });
  if (firstUser) {
    return firstUser;
  }

  const password = await hashPassword(DEFAULT_SEED_PASSWORD);
  return prisma.user.create({
    data: {
      email: DEFAULT_SEED_EMAIL,
      name: DEFAULT_SEED_NAME,
      phone: requestedPhone,
      password,
    },
  });
}

async function ensureSenderName(userId: string, name: string) {
  return prisma.senderName.upsert({
    where: {
      userId_name: { userId, name },
    },
    update: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: "seed",
      rejectNote: null,
    },
    create: {
      userId,
      name,
      status: "APPROVED",
      approvedAt: new Date(),
      approvedBy: "seed",
    },
  });
}

async function ensureTag(userId: string, name: string, color: string) {
  return prisma.tag.upsert({
    where: {
      userId_name: { userId, name },
    },
    update: { color },
    create: { userId, name, color },
  });
}

async function ensureContact(userId: string, contact: { name: string; phone: string; email?: string; tags?: string }) {
  return prisma.contact.upsert({
    where: {
      userId_phone: {
        userId,
        phone: contact.phone,
      },
    },
    update: {
      name: contact.name,
      email: contact.email || null,
      tags: contact.tags || null,
    },
    create: {
      userId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || null,
      tags: contact.tags || null,
    },
  });
}

async function ensureTemplate(userId: string, name: string, content: string, category: string) {
  const existing = await prisma.messageTemplate.findFirst({
    where: { userId, name },
  });

  if (existing) {
    return prisma.messageTemplate.update({
      where: { id: existing.id },
      data: { content, category },
    });
  }

  return prisma.messageTemplate.create({
    data: { userId, name, content, category },
  });
}

async function ensureGroup(userId: string, name: string) {
  const existing = await prisma.contactGroup.findFirst({
    where: { userId, name },
  });
  if (existing) {
    return existing;
  }

  return prisma.contactGroup.create({
    data: { userId, name },
  });
}

async function ensureCampaign(userId: string, input: {
  name: string;
  senderName: string;
  contactGroupId: string;
  templateId: string;
  status: string;
  scheduledAt: Date | null;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  creditReserved: number;
  creditUsed: number;
}) {
  const existing = await prisma.campaign.findFirst({
    where: { userId, name: input.name },
  });

  if (existing) {
    return prisma.campaign.update({
      where: { id: existing.id },
      data: input,
    });
  }

  return prisma.campaign.create({
    data: {
      userId,
      ...input,
    },
  });
}

async function seedDashboardData(userId: string) {
  await ensureSenderName(userId, "SMSOK");

  const [vipTag, newTag] = await Promise.all([
    ensureTag(userId, "vip", "#22C55E"),
    ensureTag(userId, "new", "#0EA5E9"),
  ]);

  const contacts = await Promise.all([
    ensureContact(userId, {
      name: "Alice Customer",
      phone: "0897000001",
      email: "alice@example.com",
      tags: "vip,new",
    }),
    ensureContact(userId, {
      name: "Bob Buyer",
      phone: "0897000002",
      email: "bob@example.com",
      tags: "vip",
    }),
    ensureContact(userId, {
      name: "Charlie Lead",
      phone: "0897000003",
      email: "charlie@example.com",
      tags: "new",
    }),
    ensureContact(userId, {
      name: "Dana Ops",
      phone: "0897000004",
      email: "dana@example.com",
    }),
  ]);

  await prisma.contactTag.createMany({
    data: [
      { contactId: contacts[0].id, tagId: vipTag.id },
      { contactId: contacts[0].id, tagId: newTag.id },
      { contactId: contacts[1].id, tagId: vipTag.id },
      { contactId: contacts[2].id, tagId: newTag.id },
    ],
    skipDuplicates: true,
  });

  const group = await ensureGroup(userId, "Seed VIP Customers");
  await prisma.contactGroupMember.createMany({
    data: contacts.slice(0, 3).map((contact) => ({
      groupId: group.id,
      contactId: contact.id,
    })),
    skipDuplicates: true,
  });

  const template = await ensureTemplate(
    userId,
    "Seed Promo Template",
    "Seed promo for {{name}}. Use code SMSOK20 today.",
    "marketing"
  );

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await ensureCampaign(userId, {
    name: "Seed Promo Campaign",
    senderName: "SMSOK",
    contactGroupId: group.id,
    templateId: template.id,
    status: "scheduled",
    scheduledAt,
    totalRecipients: 3,
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    creditReserved: 3,
    creditUsed: 0,
  });

  await prisma.message.deleteMany({
    where: {
      userId,
      content: { startsWith: SEED_MESSAGE_PREFIX },
    },
  });

  const seededMessages = [
    { offsetDays: 0, offsetHours: 1, recipient: "0897000001", status: "delivered", senderName: "SMSOK", content: `${SEED_MESSAGE_PREFIX} Promo delivered`, creditCost: 1, sentAtHours: 1, deliveredAtMinutes: 6 },
    { offsetDays: 0, offsetHours: 3, recipient: "0897000002", status: "sent", senderName: "SMSOK", content: `${SEED_MESSAGE_PREFIX} Promo sent`, creditCost: 1, sentAtHours: 3, deliveredAtMinutes: null },
    { offsetDays: 1, offsetHours: 2, recipient: "0897000003", status: "failed", senderName: "EasySlip", content: `${SEED_MESSAGE_PREFIX} Retry failed`, creditCost: 1, sentAtHours: null, deliveredAtMinutes: null },
    { offsetDays: 1, offsetHours: 5, recipient: "0897000004", status: "delivered", senderName: "EasySlip", content: `${SEED_MESSAGE_PREFIX} Receipt delivered`, creditCost: 1, sentAtHours: 5, deliveredAtMinutes: 4 },
    { offsetDays: 2, offsetHours: 4, recipient: "0897000001", status: "pending", senderName: "SMSOK", content: `${SEED_MESSAGE_PREFIX} Pending queue`, creditCost: 1, sentAtHours: null, deliveredAtMinutes: null },
    { offsetDays: 3, offsetHours: 6, recipient: "0897000002", status: "delivered", senderName: "SMSOK", content: `${SEED_MESSAGE_PREFIX} Coupon delivered`, creditCost: 1, sentAtHours: 6, deliveredAtMinutes: 5 },
    { offsetDays: 4, offsetHours: 7, recipient: "0897000003", status: "sent", senderName: "EasySlip", content: `${SEED_MESSAGE_PREFIX} Follow up sent`, creditCost: 1, sentAtHours: 7, deliveredAtMinutes: null },
    { offsetDays: 6, offsetHours: 8, recipient: "0897000004", status: "delivered", senderName: "EasySlip", content: `${SEED_MESSAGE_PREFIX} Welcome delivered`, creditCost: 1, sentAtHours: 8, deliveredAtMinutes: 3 },
  ];

  await prisma.message.createMany({
    data: seededMessages.map((message) => {
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - message.offsetDays);
      createdAt.setHours(message.offsetHours, 0, 0, 0);

      const sentAt = message.sentAtHours === null
        ? null
        : new Date(new Date(createdAt).setHours(message.sentAtHours, 5, 0, 0));

      const deliveredAt = message.deliveredAtMinutes === null || sentAt === null
        ? null
        : new Date(sentAt.getTime() + message.deliveredAtMinutes * 60 * 1000);

      return {
        userId,
        recipient: message.recipient,
        content: message.content,
        senderName: message.senderName,
        status: message.status,
        creditCost: message.creditCost,
        createdAt,
        sentAt,
        deliveredAt,
      };
    }),
  });
}

// ══════════════════════════════════════════════════════════
// Phase 1: Multi-Tenant + PDPA + Backoffice Seed
// ══════════════════════════════════════════════════════════

async function seedMultiTenant(userId: string) {
  // Create organization for seed user
  const org = await prisma.organization.upsert({
    where: { slug: "seed-org" },
    update: {},
    create: {
      name: "Seed Organization",
      slug: "seed-org",
      plan: "starter",
    },
  });

  // OWNER membership
  await prisma.membership.upsert({
    where: { userId_organizationId: { userId, organizationId: org.id } },
    update: {},
    create: { userId, organizationId: org.id, role: "OWNER" },
  });

  // Backfill organizationId on existing contacts
  await prisma.$executeRawUnsafe(
    `UPDATE contacts SET organization_id = $1 WHERE user_id = $2 AND organization_id IS NULL`,
    org.id, userId
  );
  await prisma.$executeRawUnsafe(
    `UPDATE messages SET organization_id = $1 WHERE user_id = $2 AND organization_id IS NULL`,
    org.id, userId
  );

  console.log(`  ✅ Organization: ${org.name} (slug: ${org.slug})`);
  return org;
}

async function seedPDPA(userId: string, orgId: string) {
  // Add PDPA consent for existing seed contacts
  const contacts = await prisma.contact.findMany({
    where: { userId },
    select: { id: true, phone: true },
    take: 10,
  });

  for (const contact of contacts) {
    await prisma.consent.upsert({
      where: { id: `seed_consent_${contact.id}_marketing` },
      update: {},
      create: {
        id: `seed_consent_${contact.id}_marketing`,
        organizationId: orgId,
        contactId: contact.id,
        purpose: "MARKETING",
        granted: true,
        source: "import",
      },
    });
    await prisma.consent.upsert({
      where: { id: `seed_consent_${contact.id}_transactional` },
      update: {},
      create: {
        id: `seed_consent_${contact.id}_transactional`,
        organizationId: orgId,
        contactId: contact.id,
        purpose: "TRANSACTIONAL",
        granted: true,
        source: "import",
      },
    });
  }
  console.log(`  ✅ PDPA consents: ${contacts.length * 2} records`);
}

async function resolveAdminSeedPassword(allowDefaultPassword: boolean) {
  const configuredPassword = process.env.ADMIN_SEED_PASSWORD?.trim();
  if (configuredPassword) {
    return configuredPassword;
  }

  if (allowDefaultPassword) {
    return DEFAULT_ADMIN_SEED_PASSWORD;
  }

  throw new Error("ADMIN_SEED_PASSWORD is required when NODE_ENV=production");
}

async function seedAdminUsers(options: { allowDefaultPassword: boolean }) {
  const adminPassword = await hashPassword(
    await resolveAdminSeedPassword(options.allowDefaultPassword),
  );

  const admins = [
    { email: "admin@smsok.com", name: "Super Admin", role: "SUPER_ADMIN" as const },
    { email: "finance@smsok.com", name: "Finance Admin", role: "FINANCE" as const },
    { email: "ops@smsok.com", name: "Operations Admin", role: "OPERATIONS" as const },
    { email: "support@smsok.com", name: "Support Admin", role: "SUPPORT" as const },
  ];

  for (const a of admins) {
    await prisma.adminUser.upsert({
      where: { email: a.email },
      update: { password: adminPassword, name: a.name, role: a.role },
      create: { email: a.email, name: a.name, password: adminPassword, role: a.role },
    });
  }
  console.log(`  ✅ Admin users: ${admins.length} created`);
  return admins.length;
}

async function seedSmsProviders() {
  await prisma.smsProvider.upsert({
    where: { name: "easythunder" },
    update: {},
    create: {
      name: "easythunder",
      displayName: "EasyThunder (Primary)",
      apiUrl: "https://sms-api.easythunder.com",
      credentials: { username: "test", password: "test" },
      costPerSms: 0.35,
      priority: 0,
      status: "ACTIVE",
      dailyLimit: 10000,
    },
  });
  await prisma.smsProvider.upsert({
    where: { name: "thaibulksms" },
    update: {},
    create: {
      name: "thaibulksms",
      displayName: "ThaiBulkSMS (Backup)",
      apiUrl: "https://api.thaibulksms.com",
      credentials: { apiKey: "test_key", apiSecret: "test_secret" },
      costPerSms: 0.40,
      priority: 1,
      status: "ACTIVE",
      dailyLimit: 5000,
    },
  });
  console.log(`  ✅ SMS Providers: 2 created`);
}

async function seedBackoffice() {
  await seedAdminUsers({ allowDefaultPassword: true });
  await seedSmsProviders();

  // Note: CreditPackage and PricingTier models removed.
  // Package tiers are now seeded via seedPackageTiers().
}

async function seedAuditLog(userId: string, orgId: string) {
  await prisma.auditLog.create({
    data: {
      organizationId: orgId,
      userId,
      action: "seed.complete",
      resource: "System",
      result: "success",
      metadata: { seededAt: new Date().toISOString(), version: "phase1+backoffice" },
    },
  });
  console.log(`  ✅ Audit log: seed.complete`);
}

async function seedPlans() {
  const plans = [
    { name: "starter", displayName: "Starter", price: 49900, credits: 500, maxSenders: 5, sortOrder: 1, features: { support: "email", api: true } },
    { name: "business", displayName: "Business", price: 149900, credits: 2000, maxSenders: 20, sortOrder: 2, features: { support: "priority", api: true, webhooks: true, sla: "99.5%" } },
    { name: "enterprise", displayName: "Enterprise", price: 499900, credits: 10000, maxSenders: -1, sortOrder: 3, features: { support: "dedicated", api: true, webhooks: true, sla: "99.9%", customIntegration: true } },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: { displayName: plan.displayName, price: plan.price, credits: plan.credits, maxSenders: plan.maxSenders, sortOrder: plan.sortOrder, features: plan.features },
      create: plan,
    });
  }
  console.log(`  ✅ Plans: ${plans.length} upserted`);
}

async function seedPackageTiers() {
  const tiers = [
    { tierCode: "TRIAL", name: "Trial", price: 0, smsQuota: 15, bonusPercent: 0, senderNameLimit: 1, expiryMonths: 1, isTrial: true, sortOrder: 0 },
    { tierCode: "A", name: "Starter", price: 490, smsQuota: 2450, bonusPercent: 0, senderNameLimit: 5, expiryMonths: 6, sortOrder: 1 },
    { tierCode: "B", name: "Basic", price: 990, smsQuota: 4950, bonusPercent: 12, senderNameLimit: 10, expiryMonths: 12, sortOrder: 2 },
    { tierCode: "C", name: "Growth", price: 9900, smsQuota: 49352, bonusPercent: 18, senderNameLimit: 15, expiryMonths: 24, sortOrder: 3 },
    { tierCode: "D", name: "Business", price: 49000, smsQuota: 244902, bonusPercent: 22, senderNameLimit: 20, expiryMonths: 24, sortOrder: 4 },
    { tierCode: "E", name: "Pro", price: 99000, smsQuota: 493991, bonusPercent: 28, senderNameLimit: null, expiryMonths: 36, sortOrder: 5 },
    { tierCode: "F", name: "Enterprise", price: 290000, smsQuota: 1749830, bonusPercent: 33, senderNameLimit: null, expiryMonths: 36, sortOrder: 6 },
    { tierCode: "G", name: "Corporate", price: 490000, smsQuota: 3154930, bonusPercent: 42, senderNameLimit: null, expiryMonths: 36, sortOrder: 7 },
    { tierCode: "H", name: "Ultimate", price: 990000, smsQuota: 6252632, bonusPercent: 52, senderNameLimit: null, expiryMonths: 36, sortOrder: 8 },
  ];

  for (const tier of tiers) {
    const totalSms = tier.smsQuota + Math.floor((tier.smsQuota * tier.bonusPercent) / 100);
    await prisma.packageTier.upsert({
      where: { tierCode: tier.tierCode },
      update: {
        name: tier.name,
        price: tier.price,
        smsQuota: tier.smsQuota,
        bonusPercent: tier.bonusPercent,
        totalSms,
        senderNameLimit: tier.senderNameLimit,
        expiryMonths: tier.expiryMonths,
        isTrial: tier.isTrial ?? false,
        isActive: true,
        sortOrder: tier.sortOrder,
      },
      create: {
        ...tier,
        totalSms,
      },
    });
  }
  console.log(`  ✅ Package tiers: ${tiers.length} upserted (TRIAL + A-H)`);
}

async function seedPdpaPolicies(createdBy?: string) {
  const policies = [
    {
      type: "TERMS",
      version: "1.0",
      title: "ข้อตกลงการใช้บริการ",
      summary: "ข้อกำหนดการใช้บริการสำหรับระบบ SMSOK",
      content: "Placeholder policy content for Terms of Service.",
    },
    {
      type: "PRIVACY",
      version: "1.0",
      title: "นโยบายความเป็นส่วนตัว",
      summary: "แนวทางการเก็บ ใช้ และเปิดเผยข้อมูลส่วนบุคคล",
      content: "Placeholder policy content for Privacy Policy.",
    },
    {
      type: "MARKETING",
      version: "1.0",
      title: "ความยินยอมการตลาด",
      summary: "ความยินยอมในการรับข่าวสาร โปรโมชั่น และข้อเสนอทางการตลาด",
      content: "Placeholder policy content for Marketing Consent.",
    },
  ] as const;

  for (const policy of policies) {
    await prisma.pdpaPolicy.upsert({
      where: {
        type_version: {
          type: policy.type,
          version: policy.version,
        },
      },
      update: {
        title: policy.title,
        summary: policy.summary,
        content: policy.content,
        requiresReconsent: false,
        isActive: true,
        createdBy: createdBy ?? null,
      },
      create: {
        ...policy,
        requiresReconsent: false,
        isActive: true,
        createdBy: createdBy ?? null,
      },
    });
  }

  console.log(`  ✅ PDPA policies: ${policies.length} upserted`);
}

// ══════════════════════════════════════════════════════════
// RBAC: Permissions + System Roles
// ══════════════════════════════════════════════════════════

const RBAC_RESOURCES = [
  "sms", "contact", "campaign", "template", "group", "tag",
  "billing", "invoice", "credit", "transaction",
  "api_key", "webhook", "user", "org", "role",
  "audit_log", "ticket", "analytics", "settings",
] as const;

const RBAC_ACTIONS = ["create", "read", "update", "delete", "manage"] as const;

type SystemRoleDef = {
  name: string;
  description: string;
  permissions: string[]; // "action:resource" or "*:*" or "resource:*" or "*:action"
};

const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    name: "Owner",
    description: "เจ้าของ org — ทำได้ทุกอย่าง",
    permissions: ["*:*"],
  },
  {
    name: "Admin",
    description: "ผู้ดูแลระบบ — ทุกอย่างยกเว้น delete org",
    permissions: ["*:*", "!delete:org"],
  },
  {
    name: "Member",
    description: "สมาชิกทั่วไป — ส่ง SMS, จัดการ contacts",
    permissions: [
      "sms:*", "contact:*", "campaign:*", "template:*",
      "group:*", "tag:*",
    ],
  },
  {
    name: "Viewer",
    description: "ดูอย่างเดียว — ไม่แก้ไขอะไร",
    permissions: ["*:read"],
  },
  {
    name: "API-only",
    description: "สำหรับ API access — ไม่มี UI",
    permissions: ["create:sms", "read:sms", "read:contact"],
  },
];

function expandPermissions(patterns: string[]): Array<{ action: string; resource: string }> {
  const allPerms: Array<{ action: string; resource: string }> = [];
  for (const action of RBAC_ACTIONS) {
    for (const resource of RBAC_RESOURCES) {
      allPerms.push({ action, resource });
    }
  }

  const excluded = new Set<string>();
  const included = new Set<string>();

  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      const p = pattern.slice(1);
      const [a, r] = p.split(":");
      for (const perm of allPerms) {
        if ((a === "*" || a === perm.action) && (r === "*" || r === perm.resource)) {
          excluded.add(`${perm.action}:${perm.resource}`);
        }
      }
      continue;
    }

    const [left, right] = pattern.split(":");
    // Could be "action:resource", "*:*", "resource:*", "*:action"
    // Spec uses "sms:*" meaning "all actions on sms" and "*:read" meaning "read on all resources"
    for (const perm of allPerms) {
      const matchDirect = (left === "*" || left === perm.action) && (right === "*" || right === perm.resource);
      const matchReversed = (left === "*" || left === perm.resource) && (right === "*" || right === perm.action);
      if (matchDirect || matchReversed) {
        included.add(`${perm.action}:${perm.resource}`);
      }
    }
  }

  // Remove excluded
  for (const ex of excluded) {
    included.delete(ex);
  }

  return [...included].map((p) => {
    const [action, resource] = p.split(":");
    return { action, resource };
  });
}

async function seedRBAC(orgId: string) {
  // 1. Seed all permissions (idempotent via upsert)
  let permCount = 0;
  for (const action of RBAC_ACTIONS) {
    for (const resource of RBAC_RESOURCES) {
      await prisma.permission.upsert({
        where: { action_resource: { action, resource } },
        update: {},
        create: {
          action,
          resource,
          description: `${action} ${resource}`,
        },
      });
      permCount++;
    }
  }
  console.log(`  ✅ Permissions: ${permCount} seeded (${RBAC_RESOURCES.length} resources × ${RBAC_ACTIONS.length} actions)`);

  // 2. Seed system roles for the org
  for (const roleDef of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: orgId, name: roleDef.name } },
      update: { description: roleDef.description },
      create: {
        organizationId: orgId,
        name: roleDef.name,
        description: roleDef.description,
        isSystemRole: true,
      },
    });

    // Expand permission patterns and link
    const expanded = expandPermissions(roleDef.permissions);
    const permIds: string[] = [];
    for (const { action, resource } of expanded) {
      const perm = await prisma.permission.findUnique({
        where: { action_resource: { action, resource } },
      });
      if (perm) permIds.push(perm.id);
    }

    // Clear existing and re-link
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }

    console.log(`  ✅ Role "${roleDef.name}": ${permIds.length} permissions`);
  }
}

async function main() {
  if (process.env.SEED_SCOPE === "qa-user") {
    throw new Error("QA seed moved to `bun run db:seed:qa` and is disabled in prisma/seed.ts");
  }

  if (process.env.NODE_ENV === "production") {
    console.log("🌱 Seeding SMSOK Clone (production admin-only mode)...\n");
    const adminCount = await seedAdminUsers({ allowDefaultPassword: false });
    console.log(JSON.stringify({
      seeded: true,
      mode: "production-admin-only",
      admins: adminCount,
      note: "Set ADMIN_SEED_PASSWORD to seed production admin users safely.",
    }, null, 2));
    console.log("\n🌱 Seed complete!");
    return;
  }

  console.log("🌱 Seeding SMSOK Clone (Phase 1 + Backoffice + Packages + RBAC)...\n");

  const user = await resolveSeedUser();
  await seedDashboardData(user.id);

  console.log("\n📦 Phase 1: Multi-Tenant + PDPA...");
  const org = await seedMultiTenant(user.id);
  await seedPDPA(user.id, org.id);
  await seedPdpaPolicies(user.id);

  console.log("\n🔧 Backoffice: Admin + Providers...");
  await seedBackoffice();

  console.log("\n💳 Payment: Plans + Package Tiers...");
  await seedPlans();
  await seedPackageTiers();

  console.log("\n🔐 RBAC: Permissions + System Roles...");
  await seedRBAC(org.id);
  const ownerRole = await prisma.role.findUnique({
    where: { organizationId_name: { organizationId: org.id, name: "Owner" } },
    select: { id: true },
  });
  if (ownerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          userId: user.id,
          roleId: ownerRole.id,
          organizationId: org.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: ownerRole.id,
        organizationId: org.id,
      },
    });
  }

  await seedAuditLog(user.id, org.id);

  const [messageCount, contactCount, tagCount, campaignCount, packageTierCount, pdpaPolicyCount, orgCount, adminCount, permCount, roleCount] = await Promise.all([
    prisma.message.count({ where: { userId: user.id } }),
    prisma.contact.count({ where: { userId: user.id } }),
    prisma.tag.count({ where: { userId: user.id } }),
    prisma.campaign.count({ where: { userId: user.id } }),
    prisma.packageTier.count(),
    prisma.pdpaPolicy.count({ where: { isActive: true } }),
    prisma.organization.count(),
    prisma.adminUser.count(),
    prisma.permission.count(),
    prisma.role.count({ where: { organizationId: org.id } }),
  ]);

  console.log(JSON.stringify({
    seeded: true,
    user: { id: user.id, email: user.email },
    organization: { id: org.id, slug: org.slug },
    counts: {
      packageTiers: packageTierCount,
      pdpaPolicies: pdpaPolicyCount,
      permissions: permCount,
      roles: roleCount,
      messages: messageCount,
      contacts: contactCount,
      tags: tagCount,
      campaigns: campaignCount,
      organizations: orgCount,
      admins: adminCount,
    },
    note: "Use SEED_EMAIL=<email> bunx prisma db seed to target a specific user.",
  }, null, 2));

  console.log("\n🌱 Seed complete!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
