import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_QA_EMAIL = "qa-suite@smsok.test";
const DEFAULT_QA_PHONE = "+66900000099";
const DEFAULT_QA_PASSWORD = "QATest123!";
const DEFAULT_QA_NAME = "QA Suite";
const DEFAULT_QA_ORG_NAME = "QA Suite";
const DEFAULT_QA_ORG_SLUG = "qa-suite-org";

type SeedQaUserOptions = {
  email?: string;
  phone?: string;
  password?: string;
  name?: string;
  organizationName?: string;
  organizationSlug?: string;
};

function addMonths(base: Date, months: number) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

export async function seedQaUser(
  options: SeedQaUserOptions = {},
  client: PrismaClient = prisma,
) {
  const email = options.email ?? process.env.QA_SEED_EMAIL?.trim() ?? DEFAULT_QA_EMAIL;
  const phone = options.phone ?? process.env.QA_SEED_PHONE?.trim() ?? DEFAULT_QA_PHONE;
  const password = options.password ?? process.env.QA_SEED_PASSWORD?.trim() ?? DEFAULT_QA_PASSWORD;
  const name = options.name ?? process.env.QA_SEED_NAME?.trim() ?? DEFAULT_QA_NAME;
  const organizationName =
    options.organizationName ??
    process.env.QA_SEED_ORG_NAME?.trim() ??
    DEFAULT_QA_ORG_NAME;
  const organizationSlug =
    options.organizationSlug ??
    process.env.QA_SEED_ORG_SLUG?.trim() ??
    DEFAULT_QA_ORG_SLUG;

  if (password.length < 10) {
    throw new Error("QA_SEED_PASSWORD ต้องยาวอย่างน้อย 10 ตัวอักษร");
  }

  const passwordHash = await bcrypt.hash(password, 12);
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

    const organization = await tx.organization.upsert({
      where: { slug: organizationSlug },
      update: { name: organizationName },
      create: {
        name: organizationName,
        slug: organizationSlug,
        plan: "starter",
      },
    });

    await tx.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: { role: "OWNER" },
      create: {
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

    const trialTier = await tx.packageTier.upsert({
      where: { tierCode: "TRIAL" },
      update: {
        name: "Trial",
        price: 0,
        smsQuota: 500,
        bonusPercent: 0,
        totalSms: 500,
        senderNameLimit: 1,
        expiryMonths: 1,
        isTrial: true,
        isActive: true,
        sortOrder: -1,
      },
      create: {
        name: "Trial",
        tierCode: "TRIAL",
        price: 0,
        smsQuota: 500,
        bonusPercent: 0,
        totalSms: 500,
        senderNameLimit: 1,
        expiryMonths: 1,
        isTrial: true,
        isActive: true,
        sortOrder: -1,
      },
    });

    const activePackage = await tx.packagePurchase.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "desc" },
      select: {
        id: true,
        smsTotal: true,
        smsUsed: true,
        expiresAt: true,
      },
    });

    const qaPackage =
      activePackage ??
      (await tx.packagePurchase.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          tierId: trialTier.id,
          smsTotal: trialTier.totalSms,
          smsUsed: 0,
          expiresAt: addMonths(new Date(), trialTier.expiryMonths),
          isActive: true,
        },
        select: {
          id: true,
          smsTotal: true,
          smsUsed: true,
          expiresAt: true,
        },
      }));

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

if ((import.meta as unknown as Record<string, unknown>).main) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
