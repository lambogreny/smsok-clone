import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_QA_EMAIL = "qa-suite@smsok.test";
const DEFAULT_QA_PHONE = "+66900000099";
// QA password must be set via env var or passed as option — no hardcoded default
const DEFAULT_QA_NAME = "QA Suite";
const DEFAULT_QA_ORG_NAME = "QA Suite";
const DEFAULT_QA_ORG_SLUG_BASE = "qa-suite-org";
const QA_PACKAGE_TIER_CODE = "QA_TRIAL_DEV";

type SeedQaUserOptions = {
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  organizationName?: string;
  organizationSlugBase?: string;
};

function addMonths(base: Date, months: number) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function assertQaSeedAllowed() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("QA seed is disabled in production. Use `bun prisma/seed.ts` for admin-only seeding.");
  }
}

function normalizeSlugBase(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return normalized || DEFAULT_QA_ORG_SLUG_BASE;
}

function createQaOrganizationSlug(base: string) {
  return `${normalizeSlugBase(base)}-${randomUUID().slice(0, 8)}`;
}

async function ensureQaTier(tx: Prisma.TransactionClient) {
  return tx.packageTier.upsert({
    where: { tierCode: QA_PACKAGE_TIER_CODE },
    update: {},
    create: {
      name: "QA Trial",
      tierCode: QA_PACKAGE_TIER_CODE,
      price: 0,
      smsQuota: 500,
      bonusPercent: 0,
      totalSms: 500,
      senderNameLimit: 1,
      expiryMonths: 1,
      isTrial: true,
      isActive: true,
      sortOrder: -99,
    },
  });
}

export async function seedQaUser(
  options: SeedQaUserOptions = {},
  client: PrismaClient = prisma,
) {
  assertQaSeedAllowed();

  const email = options.email ?? process.env.QA_SEED_EMAIL?.trim() ?? DEFAULT_QA_EMAIL;
  const phone = options.phone ?? process.env.QA_SEED_PHONE?.trim() ?? DEFAULT_QA_PHONE;
  const password = options.password ?? process.env.QA_SEED_PASSWORD?.trim();
  if (!password) throw new Error("QA_SEED_PASSWORD env var or options.password required");
  const name = options.name ?? process.env.QA_SEED_NAME?.trim() ?? DEFAULT_QA_NAME;
  const organizationName =
    options.organizationName ??
    process.env.QA_SEED_ORG_NAME?.trim() ??
    DEFAULT_QA_ORG_NAME;
  const organizationSlugBase =
    options.organizationSlugBase ??
    process.env.QA_SEED_ORG_SLUG?.trim() ??
    DEFAULT_QA_ORG_SLUG_BASE;

  if (password.length < 10) {
    throw new Error("QA_SEED_PASSWORD ต้องยาวอย่างน้อย 10 ตัวอักษร");
  }

  const passwordHash = await Bun.password.hash(password, { algorithm: "argon2id", memoryCost: 19456, timeCost: 2 });
  const acceptedTermsAt = new Date();

  return client.$transaction(async (tx) => {
    const phoneOwner = await tx.user.findUnique({
      where: { phone },
      select: { id: true, email: true },
    });

    if (phoneOwner && phoneOwner.email !== email) {
      throw new Error(`เบอร์ ${phone} ถูกใช้งานโดย ${phoneOwner.email} แล้ว`);
    }

    const user = await tx.user.upsert({
      where: { email },
      update: {
        name,
        phone,
        password: passwordHash,
        role: "user",
        emailVerified: true,
        phoneVerified: true,
        mustChangePassword: false,
        deletedAt: null,
        acceptedTermsAt,
      },
      create: {
        email,
        phone,
        name,
        password: passwordHash,
        role: "user",
        emailVerified: true,
        phoneVerified: true,
        acceptedTermsAt,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: createQaOrganizationSlug(organizationSlugBase),
        plan: "starter",
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    await tx.notificationPrefs.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const qaTier = await ensureQaTier(tx);
    const qaPackage = await tx.packagePurchase.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        tierId: qaTier.id,
        smsTotal: qaTier.totalSms,
        smsUsed: 0,
        expiresAt: addMonths(new Date(), qaTier.expiryMonths),
        isActive: true,
      },
      select: {
        id: true,
        smsTotal: true,
        smsUsed: true,
        expiresAt: true,
      },
    });

    return {
      seeded: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
      organization: {
        id: organization.id,
        slug: organization.slug,
      },
      package: {
        id: qaPackage.id,
        smsTotal: qaPackage.smsTotal,
        smsRemaining: qaPackage.smsTotal - qaPackage.smsUsed,
        expiresAt: qaPackage.expiresAt.toISOString(),
      },
    };
  });
}

async function main() {
  const result = await seedQaUser();
  console.log(JSON.stringify(result, null, 2));
}

const isMainModule = process.argv[1]?.endsWith("seed-qa.ts");

if (isMainModule) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
