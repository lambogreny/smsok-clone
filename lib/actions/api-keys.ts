"use server";

import { prisma as db } from "../db";
import { createApiKeySchema, idSchema } from "../validations";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

// ==========================================
// Generate API key (sk_live_xxxxx format)
// ==========================================

function generateApiKey(): string {
  return "sk_live_" + randomBytes(32).toString("hex");
}

// ==========================================
// Create API key
// ==========================================

export async function createApiKey(userId: string, data: unknown) {
  const input = createApiKeySchema.parse(data);

  // Limit: max 5 API keys per user
  const count = await db.apiKey.count({ where: { userId } });
  if (count >= 5) {
    throw new Error("สร้าง API Key ได้สูงสุด 5 ตัว");
  }

  const key = generateApiKey();

  const apiKey = await db.apiKey.create({
    data: {
      userId,
      name: input.name,
      key,
    },
  });

  revalidatePath("/dashboard/api-keys");

  // Return the key only once (on creation)
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

export async function getApiKeys(userId: string) {
  const keys = await db.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      key: true,
      isActive: true,
      lastUsed: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k: typeof keys[number]) => ({
    ...k,
    key: k.key.slice(0, 12) + "..." + k.key.slice(-4),
  }));
}

// ==========================================
// Toggle API key active/inactive
// ==========================================

export async function toggleApiKey(userId: string, keyId: string) {
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
// Delete API key
// ==========================================

export async function deleteApiKey(userId: string, keyId: string) {
  idSchema.parse({ id: keyId });

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId },
  });
  if (!apiKey) throw new Error("ไม่พบ API Key");

  await db.apiKey.delete({ where: { id: keyId } });
  revalidatePath("/dashboard/api-keys");
}
