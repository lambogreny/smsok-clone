import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PACKAGES = [
  { name: "SMSOK A", price: 50000, bonusPercent: 0, totalCredits: 2273, maxSenders: 5, durationDays: 180 },
  { name: "SMSOK B", price: 100000, bonusPercent: 10, totalCredits: 5000, maxSenders: 10, durationDays: 365 },
  { name: "SMSOK C", price: 1000000, bonusPercent: 15, totalCredits: 52273, maxSenders: 15, durationDays: 730, isBestSeller: true },
  { name: "SMSOK D", price: 5000000, bonusPercent: 20, totalCredits: 272727, maxSenders: 20, durationDays: 730 },
  { name: "SMSOK E", price: 10000000, bonusPercent: 25, totalCredits: 568182, maxSenders: -1, durationDays: 1095 },
  { name: "SMSOK F", price: 30000000, bonusPercent: 30, totalCredits: 1772727, maxSenders: -1, durationDays: 1095 },
  { name: "SMSOK G", price: 50000000, bonusPercent: 40, totalCredits: 3181818, maxSenders: -1, durationDays: 1095 },
  { name: "SMSOK H", price: 100000000, bonusPercent: 50, totalCredits: 6818182, maxSenders: -1, durationDays: 1095 },
];

const SEED_MESSAGE_PREFIX = "[smsok-seed]";
const DEFAULT_SEED_EMAIL = "demo@smsok.local";
const DEFAULT_SEED_PASSWORD = "Password123!";

async function ensurePackages() {
  for (const pkg of PACKAGES) {
    const id = pkg.name.replace(" ", "-").toLowerCase();
    await prisma.package.upsert({
      where: { id },
      update: {
        name: pkg.name,
        price: pkg.price,
        bonusPercent: pkg.bonusPercent,
        totalCredits: pkg.totalCredits,
        maxSenders: pkg.maxSenders,
        durationDays: pkg.durationDays,
        isBestSeller: pkg.isBestSeller ?? false,
        isActive: true,
      },
      create: {
        id,
        name: pkg.name,
        price: pkg.price,
        bonusPercent: pkg.bonusPercent,
        totalCredits: pkg.totalCredits,
        maxSenders: pkg.maxSenders,
        durationDays: pkg.durationDays,
        isBestSeller: pkg.isBestSeller ?? false,
        isActive: true,
      },
    });
  }
}

async function resolveSeedUser() {
  const requestedEmail = process.env.SEED_EMAIL?.trim();
  if (requestedEmail) {
    const existing = await prisma.user.findUnique({
      where: { email: requestedEmail },
    });
    if (existing) {
      return existing;
    }

    const password = await bcrypt.hash(process.env.SEED_PASSWORD || DEFAULT_SEED_PASSWORD, 12);
    return prisma.user.create({
      data: {
        email: requestedEmail,
        name: requestedEmail.split("@")[0],
        password,
        credits: 2500,
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

  const password = await bcrypt.hash(DEFAULT_SEED_PASSWORD, 12);
  return prisma.user.create({
    data: {
      email: DEFAULT_SEED_EMAIL,
      name: "Demo User",
      password,
      credits: 2500,
    },
  });
}

async function ensureSenderName(userId: string, name: string) {
  return prisma.senderName.upsert({
    where: {
      userId_name: { userId, name },
    },
    update: {
      status: "approved",
      approvedAt: new Date(),
      approvedBy: "seed",
      rejectNote: null,
    },
    create: {
      userId,
      name,
      status: "approved",
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
  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: 2500,
    },
  });

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

async function main() {
  await ensurePackages();

  const user = await resolveSeedUser();
  await seedDashboardData(user.id);

  const [messageCount, contactCount, tagCount, campaignCount, packageCount] = await Promise.all([
    prisma.message.count({ where: { userId: user.id } }),
    prisma.contact.count({ where: { userId: user.id } }),
    prisma.tag.count({ where: { userId: user.id } }),
    prisma.campaign.count({ where: { userId: user.id } }),
    prisma.package.count(),
  ]);

  console.log(JSON.stringify({
    seeded: true,
    user: {
      id: user.id,
      email: user.email,
    },
    counts: {
      packages: packageCount,
      messages: messageCount,
      contacts: contactCount,
      tags: tagCount,
      campaigns: campaignCount,
    },
    note: "Use SEED_EMAIL=<email> bunx prisma db seed to target a specific user.",
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
