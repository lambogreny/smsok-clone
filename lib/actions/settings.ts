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

// ==========================================
// Update profile (name only; phone is immutable after signup)
// ==========================================

export async function updateProfile(userId: string, data: unknown) {
  const input = updateProfileSchema.parse(data);

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
  const input = changePasswordSchema.parse(data);

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { password: true },
  });

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
    throw new Error("Unauthorized");
  }

  return changePassword(user.id, data);
}

// ==========================================
// Get profile
// ==========================================

export async function getProfile(userId: string) {
  return db.user.findUniqueOrThrow({
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
}

// ==========================================
// Workspace settings
// ==========================================

export async function getWorkspaceSettings(userId: string) {
  const settings = await db.workspaceSettings.findUnique({
    where: { userId },
  });

  return settings || {
    name: "My Workspace",
    timezone: "Asia/Bangkok",
    language: "th",
  };
}

export async function updateWorkspaceSettings(userId: string, data: unknown) {
  const input = updateWorkspaceSchema.parse(data);

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

export async function getNotificationPrefs(userId: string) {
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

export async function updateNotificationPrefs(userId: string, data: unknown) {
  const input = updateNotificationPrefsSchema.parse(data);

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
