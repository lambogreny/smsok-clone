"use server";

import { prisma as db } from "../db";
import { createApiKeySchema, idSchema } from "../validations";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { hashApiKey } from "../crypto-utils";
import { getSession } from "../auth";

// ==========================================
// Generate API key (sk_live_xxxxx format)
// ==========================================

function generateApiKey(): string {
  return "sk_live_" + randomBytes(32).toString("hex");
}

function maskApiKey(key: string): string {
  return key.slice(0, 12) + "..." + key.slice(-4);
}

// ==========================================
// Create API key
// ==========================================

export async function createApiKey(dataOrUserId: unknown, dataArg?: unknown) {
  // Support both: createApiKey(data) from client, createApiKey(userId, data) from API routes
  let userId: string;
  let data: unknown;
  if (typeof dataOrUserId === "string" && dataArg !== undefined) {
    userId = dataOrUserId;
    data = dataArg;
  } else {
    const user = await getSession();
    if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
    userId = user.id;
    data = dataOrUserId;
  }

  const input = createApiKeySchema.parse(data);

  // Limit: max 5 API keys per user
  const count = await db.apiKey.count({ where: { userId } });
  if (count >= 5) {
    throw new Error("สร้าง API Key ได้สูงสุด 5 ตัว");
  }

  const key = generateApiKey();
  const keyHash = hashApiKey(key);
  const keyPrefix = maskApiKey(key);

  const apiKey = await db.apiKey.create({
    data: {
      userId,
      name: input.name,
      key: keyHash,
      keyPrefix,
      permissions: input.permissions ?? [],
    },
  });

  revalidatePath("/dashboard/api-keys");

  // Return the full key only once (on creation) — never stored in plaintext
  return {
    id: apiKey.id,
    name: apiKey.name,
    key,
    createdAt: apiKey.createdAt,
  };
}

// ==========================================
// List API keys (mask the key)
// ==========================================

export async function getApiKeys(userId?: string) {
  if (!userId) {
    const user = await getSession();
    if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
    userId = user.id;
  }
  const keys = await db.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      isActive: true,
      lastUsed: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    key: k.keyPrefix || "sk_live_****...****",
    permissions: k.permissions,
    isActive: k.isActive,
    lastUsed: k.lastUsed,
    createdAt: k.createdAt,
  }));
}

// ==========================================
// Toggle API key active/inactive
// ==========================================

export async function toggleApiKey(userIdOrKeyId: string, keyIdArg?: string) {
  let userId: string;
  let keyId: string;
  if (keyIdArg !== undefined) {
    userId = userIdOrKeyId;
    keyId = keyIdArg;
  } else {
    const user = await getSession();
    if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
    userId = user.id;
    keyId = userIdOrKeyId;
  }

  idSchema.parse({ id: keyId });

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!apiKey) throw new Error("ไม่พบ API Key");

  const updated = await db.apiKey.update({
    where: { id: keyId },
    data: { isActive: !apiKey.isActive },
  });

  revalidatePath("/dashboard/api-keys");
  return { id: updated.id, isActive: updated.isActive };
}

// ==========================================
// Update API key name
// ==========================================

export async function updateApiKeyName(userIdOrKeyId: string, keyIdOrData: unknown, dataArg?: unknown) {
  let userId: string;
  let keyId: string;
  let data: unknown;
  if (dataArg !== undefined) {
    userId = userIdOrKeyId;
    keyId = keyIdOrData as string;
    data = dataArg;
  } else {
    const user = await getSession();
    if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
    userId = user.id;
    keyId = userIdOrKeyId;
    data = keyIdOrData;
  }

  idSchema.parse({ id: keyId });
  const input = createApiKeySchema.parse(data);

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!apiKey) throw new Error("ไม่พบ API Key");

  const updated = await db.apiKey.update({
    where: { id: keyId },
    data: { name: input.name },
    select: { id: true, name: true },
  });

  revalidatePath("/dashboard/api-keys");
  return updated;
}

// ==========================================
// Delete API key
// ==========================================

export async function deleteApiKey(userIdOrKeyId: string, keyIdArg?: string) {
  let userId: string;
  let keyId: string;
  if (keyIdArg !== undefined) {
    userId = userIdOrKeyId;
    keyId = keyIdArg;
  } else {
    const user = await getSession();
    if (!user) throw new Error("กรุณาเข้าสู่ระบบ");
    userId = user.id;
    keyId = userIdOrKeyId;
  }

  idSchema.parse({ id: keyId });

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!apiKey) throw new Error("ไม่พบ API Key");

  await db.apiKey.delete({ where: { id: keyId } });
  revalidatePath("/dashboard/api-keys");
}
