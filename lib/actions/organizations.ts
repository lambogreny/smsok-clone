
import { prisma as db } from "../db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// ── Schemas ────────────────────────────────────────────

const createOrgSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อองค์กร").max(100),
});

const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sendingHoursStart: z.number().min(8).max(20).optional(), // PDPA: legal min 8
  sendingHoursEnd: z.number().min(8).max(20).optional(),   // PDPA: legal max 20
});

const inviteSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER", "API_ONLY"]),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER", "API_ONLY"]),
});

// ── Helpers ────────────────────────────────────────────

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  const suffix = crypto.randomBytes(3).toString("hex");
  return `${base || "org"}-${suffix}`;
}

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ── Organization CRUD ──────────────────────────────────

export async function createOrganization(userId: string, data: unknown) {
  const parsed = createOrgSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const slug = generateSlug(parsed.data.name);

  const org = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
    const organization = await tx.organization.create({
      data: {
        name: parsed.data.name,
        slug,
      },
    });

    // Creator is always OWNER
    await tx.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    return organization;
  });

  return org;
}

export async function getOrganization(userId: string, orgId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!membership) throw new Error("ไม่พบองค์กรนี้");

  return db.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: { select: { memberships: true } },
    },
  });
}

export async function getUserOrganizations(userId: string) {
  const memberships = await db.membership.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: { select: { memberships: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((m: (typeof memberships)[number]) => ({
    ...m.organization,
    role: m.role,
    memberCount: m.organization._count.memberships,
  }));
}

export async function updateOrganization(userId: string, orgId: string, data: unknown) {
  // Only OWNER or ADMIN can update
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN"]);

  const parsed = updateOrgSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  return db.organization.update({
    where: { id: orgId },
    data: parsed.data,
  });
}

export async function deleteOrganization(userId: string, orgId: string) {
  await requireOrgRole(userId, orgId, ["OWNER"]);

  // Cascade delete handled by Prisma relations
  await db.organization.delete({ where: { id: orgId } });
}

// ── Membership ─────────────────────────────────────────

export async function getOrgMembers(userId: string, orgId: string) {
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN", "MEMBER", "VIEWER"]);

  return db.membership.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function updateMemberRole(
  userId: string,
  orgId: string,
  targetUserId: string,
  data: unknown
) {
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN"]);

  const parsed = updateMemberRoleSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  // Cannot change OWNER role
  const target = await db.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
  });
  if (!target) throw new Error("ไม่พบสมาชิก");
  if (target.role === "OWNER") throw new Error("ไม่สามารถเปลี่ยน role ของ Owner ได้");

  // ADMIN can only change MEMBER/VIEWER/API_ONLY
  const actor = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (actor?.role === "ADMIN" && target.role === "ADMIN") {
    throw new Error("Admin ไม่สามารถเปลี่ยน role ของ Admin อื่นได้");
  }

  return db.membership.update({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
    data: { role: parsed.data.role },
  });
}

export async function removeMember(userId: string, orgId: string, targetUserId: string) {
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN"]);

  const target = await db.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
  });
  if (!target) throw new Error("ไม่พบสมาชิก");
  if (target.role === "OWNER") throw new Error("ไม่สามารถลบ Owner ได้");
  if (targetUserId === userId) throw new Error("ไม่สามารถลบตัวเองได้");

  await db.membership.delete({
    where: { userId_organizationId: { userId: targetUserId, organizationId: orgId } },
  });
}

// ── Invites ────────────────────────────────────────────

export async function createInvite(userId: string, orgId: string, data: unknown) {
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN"]);

  const parsed = inviteSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  // Check if already a member
  const existingUser = await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existingUser) {
    const existingMember = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: orgId,
        },
      },
    });
    if (existingMember) throw new Error("ผู้ใช้นี้เป็นสมาชิกอยู่แล้ว");
  }

  // Upsert invite (replace expired/pending)
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await db.orgInvite.upsert({
    where: {
      organizationId_email: { organizationId: orgId, email: parsed.data.email },
    },
    update: {
      role: parsed.data.role,
      token,
      expiresAt,
      acceptedAt: null,
      invitedBy: userId,
    },
    create: {
      organizationId: orgId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      expiresAt,
      invitedBy: userId,
    },
  });

  return { id: invite.id, token: invite.token, expiresAt: invite.expiresAt };
}

export async function acceptInvite(userId: string, token: string) {
  const invite = await db.orgInvite.findUnique({ where: { token } });
  if (!invite) throw new Error("ลิงก์เชิญไม่ถูกต้อง");
  if (invite.acceptedAt) throw new Error("ลิงก์เชิญถูกใช้งานแล้ว");
  if (invite.expiresAt < new Date()) throw new Error("ลิงก์เชิญหมดอายุแล้ว");

  // Verify user email matches invite
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user || user.email !== invite.email) {
    throw new Error("อีเมลไม่ตรงกับลิงก์เชิญ");
  }

  await db.$transaction([
    db.membership.create({
      data: {
        userId,
        organizationId: invite.organizationId,
        role: invite.role,
      },
    }),
    db.orgInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  return { organizationId: invite.organizationId };
}

export async function getOrgInvites(userId: string, orgId: string) {
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN"]);

  return db.orgInvite.findMany({
    where: { organizationId: orgId, acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeInvite(userId: string, orgId: string, inviteId: string) {
  await requireOrgRole(userId, orgId, ["OWNER", "ADMIN"]);

  const invite = await db.orgInvite.findFirst({
    where: { id: inviteId, organizationId: orgId },
  });
  if (!invite) throw new Error("ไม่พบคำเชิญ");

  await db.orgInvite.delete({ where: { id: inviteId } });
}

// ── Permission Helper ──────────────────────────────────

export async function requireOrgRole(
  userId: string,
  orgId: string,
  allowedRoles: string[]
) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
  });
  if (!membership) throw new Error("ไม่พบองค์กรนี้");
  if (!allowedRoles.includes(membership.role)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
  return membership;
}

export async function getOrgPlan(orgId: string) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true },
  });
  if (!org) throw new Error("ไม่พบองค์กร");
  return org;
}
