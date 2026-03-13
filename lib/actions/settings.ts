"use server";

import { prisma as db } from "../db";
import { revalidatePath } from "next/cache";
import {
  changePasswordSchema,
  updateProfileSchema,
  updateWorkspaceSchema,
  updateNotificationPrefsSchema,
} from "../validations";
import { getSession, hashPassword, verifyPassword } from "../auth";
import { revokeAllUserSessions } from "../auth";
import { resolveActionUserId } from "../action-user";
import { ApiError } from "../api-auth";

// ==========================================
// Update profile (name only; phone is immutable after signup)
// ==========================================

export async function updateProfile(data: unknown): Promise<Awaited<ReturnType<typeof db.user.update>>>;
export async function updateProfile(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.user.update>>>;
export async function updateProfile(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const input = updateProfileSchema.parse(maybeData === undefined ? userIdOrData : maybeData);

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      name: input.name,
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return updated;
}

// ==========================================
// Change password
// ==========================================

export async function changePassword(userId: string, data: unknown, _currentSessionTokenHash?: string) {
  userId = await resolveActionUserId(userId);
  const input = changePasswordSchema.parse(data);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) throw new Error("ไม่พบบัญชีผู้ใช้");

  const isValid = await verifyPassword(input.currentPassword, user.password);
  if (!isValid) {
    throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  }

  // Check password history — reject if matches any of last 5
  const recentPasswords = await db.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { passwordHash: true },
  });

  for (const prev of recentPasswords) {
    const reused = await verifyPassword(input.newPassword, prev.passwordHash);
    if (reused) {
      throw new Error("ห้ามใช้รหัสผ่านที่เคยใช้แล้ว (5 รหัสล่าสุด)");
    }
  }

  // Also check current password
  const sameAsCurrent = await verifyPassword(input.newPassword, user.password);
  if (sameAsCurrent) {
    throw new Error("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน");
  }

  const hashed = await hashPassword(input.newPassword);

  await db.$transaction([
    // Save old password to history
    db.passwordHistory.create({
      data: { userId, passwordHash: user.password },
    }),
    // Update to new password
    db.user.update({
      where: { id: userId },
      data: { password: hashed },
    }),
  ]);

  await revokeAllUserSessions(userId, { incrementSecurityVersion: true });

  revalidatePath("/dashboard/settings");
  return { success: true, requiresReauth: true };
}

export async function changePasswordForSession(data: unknown) {
  const user = await getSession();
  if (!user) {
    throw new Error("กรุณาเข้าสู่ระบบ");
  }

  return changePassword(user.id, data);
}

// ==========================================
// Get profile
// ==========================================

type ProfileRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: Date;
};

export async function getProfile(): Promise<ProfileRecord>;
export async function getProfile(userId: string): Promise<ProfileRecord>;
export async function getProfile(userId?: string) {
  userId = await resolveActionUserId(userId);
  const profile = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!profile) {
    throw new ApiError(404, "ไม่พบบัญชีผู้ใช้");
  }

  return profile;
}

// ==========================================
// Workspace settings
// ==========================================

export async function getWorkspaceSettings(): Promise<Awaited<ReturnType<typeof db.workspaceSettings.findUnique>> | {
  name: string;
  timezone: string;
  language: string;
}>;
export async function getWorkspaceSettings(userId: string): Promise<Awaited<ReturnType<typeof db.workspaceSettings.findUnique>> | {
  name: string;
  timezone: string;
  language: string;
}>;
export async function getWorkspaceSettings(userId?: string) {
  userId = await resolveActionUserId(userId);
  const settings = await db.workspaceSettings.findUnique({
    where: { userId },
  });

  return settings || {
    name: "My Workspace",
    timezone: "Asia/Bangkok",
    language: "th",
  };
}

export async function updateWorkspaceSettings(data: unknown): Promise<Awaited<ReturnType<typeof db.workspaceSettings.upsert>>>;
export async function updateWorkspaceSettings(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.workspaceSettings.upsert>>>;
export async function updateWorkspaceSettings(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const input = updateWorkspaceSchema.parse(maybeData === undefined ? userIdOrData : maybeData);

  const settings = await db.workspaceSettings.upsert({
    where: { userId },
    create: {
      userId,
      name: input.name ?? "My Workspace",
      timezone: input.timezone ?? "Asia/Bangkok",
      language: input.language ?? "th",
    },
    update: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.timezone !== undefined && { timezone: input.timezone }),
      ...(input.language !== undefined && { language: input.language }),
    },
  });

  revalidatePath("/dashboard/settings");
  return settings;
}

// ==========================================
// Notification preferences
// ==========================================

export async function getNotificationPrefs(): Promise<Awaited<ReturnType<typeof db.notificationPrefs.findUnique>> | {
  emailCreditLow: boolean;
  emailCampaignDone: boolean;
  emailWeeklyReport: boolean;
  emailPackageExpiry: boolean;
  emailInvoice: boolean;
  emailSecurity: boolean;
  smsCreditLow: boolean;
  smsCampaignDone: boolean;
}>;
export async function getNotificationPrefs(userId: string): Promise<Awaited<ReturnType<typeof db.notificationPrefs.findUnique>> | {
  emailCreditLow: boolean;
  emailCampaignDone: boolean;
  emailWeeklyReport: boolean;
  emailPackageExpiry: boolean;
  emailInvoice: boolean;
  emailSecurity: boolean;
  smsCreditLow: boolean;
  smsCampaignDone: boolean;
}>;
export async function getNotificationPrefs(userId?: string) {
  userId = await resolveActionUserId(userId);
  const prefs = await db.notificationPrefs.findUnique({
    where: { userId },
    select: {
      emailCreditLow: true,
      emailCampaignDone: true,
      emailWeeklyReport: true,
      emailPackageExpiry: true,
      emailInvoice: true,
      emailSecurity: true,
      smsCreditLow: true,
      smsCampaignDone: true,
    },
  });

  return prefs || {
    emailCreditLow: true,
    emailCampaignDone: true,
    emailWeeklyReport: false,
    emailPackageExpiry: true,
    emailInvoice: true,
    emailSecurity: true,
    smsCreditLow: false,
    smsCampaignDone: false,
  };
}

export async function updateNotificationPrefs(data: unknown): Promise<Awaited<ReturnType<typeof db.notificationPrefs.upsert>>>;
export async function updateNotificationPrefs(userId: string, data: unknown): Promise<Awaited<ReturnType<typeof db.notificationPrefs.upsert>>>;
export async function updateNotificationPrefs(userIdOrData: string | unknown, maybeData?: unknown) {
  const userId = await resolveActionUserId(
    maybeData === undefined ? undefined : userIdOrData as string,
  );
  const input = updateNotificationPrefsSchema.parse(maybeData === undefined ? userIdOrData : maybeData);

  const prefs = await db.notificationPrefs.upsert({
    where: { userId },
    create: {
      userId,
      ...input,
    },
    update: input,
    select: {
      emailCreditLow: true,
      emailCampaignDone: true,
      emailWeeklyReport: true,
      emailPackageExpiry: true,
      emailInvoice: true,
      emailSecurity: true,
      smsCreditLow: true,
      smsCampaignDone: true,
    },
  });

  revalidatePath("/dashboard/settings");
  return prefs;
}
