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

export async function changePassword(userId: string, data: unknown) {
  const input = changePasswordSchema.parse(data);

  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { password: true },
  });

  const isValid = await verifyPassword(input.currentPassword, user.password);
  if (!isValid) {
    throw new Error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  }

  const hashed = await hashPassword(input.newPassword);
  await db.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  revalidatePath("/dashboard/settings");
  return { success: true };
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
      credits: true,
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
      smsCreditLow: true,
      smsCampaignDone: true,
    },
  });

  return prefs || {
    emailCreditLow: true,
    emailCampaignDone: true,
    emailWeeklyReport: false,
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
      smsCreditLow: true,
      smsCampaignDone: true,
    },
  });

  revalidatePath("/dashboard/settings");
  return prefs;
}
