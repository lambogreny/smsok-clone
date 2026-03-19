import { randomBytes } from "crypto";
import { prisma as db } from "../db";
import { hashApiKey } from "../crypto-utils";
import { createApiKeySchema, idSchema, updateApiKeyNameSchema } from "../validations";

function generateApiKey(): string {
  return "sk_live_" + randomBytes(32).toString("hex");
}

function maskApiKey(key: string): string {
  return key.slice(0, 12) + "..." + key.slice(-4);
}

export async function createApiKeyForUser(userId: string, data: unknown) {
  const input = createApiKeySchema.parse(data);

  const count = await db.apiKey.count({
    where: {
      userId,
      revokedAt: null,
    },
  });
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
      rateLimit: input.rateLimit,
      ipWhitelist: input.ipWhitelist ?? [],
    },
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    key,
    rateLimit: apiKey.rateLimit,
    ipWhitelist: apiKey.ipWhitelist,
    createdAt: apiKey.createdAt,
  };
}

export async function listApiKeysForUser(userId: string) {
  const keys = await db.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      isActive: true,
      lastUsed: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((key) => ({
    id: key.id,
    name: key.name,
    key: key.keyPrefix || "sk_live_****...****",
    permissions: key.permissions,
    rateLimit: key.rateLimit,
    ipWhitelist: key.ipWhitelist,
    isActive: key.isActive,
    lastUsed: key.lastUsed,
    revokedAt: key.revokedAt,
    createdAt: key.createdAt,
  }));
}

export async function getApiKeyForUser(userId: string, keyId: string) {
  idSchema.parse({ id: keyId });

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      rateLimit: true,
      ipWhitelist: true,
      isActive: true,
      lastUsed: true,
      revokedAt: true,
      createdAt: true,
    },
  });
  if (!apiKey) {
    throw new Error("ไม่พบ API Key");
  }

  return {
    id: apiKey.id,
    name: apiKey.name,
    key: apiKey.keyPrefix || "sk_live_****...****",
    permissions: apiKey.permissions,
    rateLimit: apiKey.rateLimit,
    ipWhitelist: apiKey.ipWhitelist,
    isActive: apiKey.isActive,
    lastUsed: apiKey.lastUsed,
    revokedAt: apiKey.revokedAt,
    createdAt: apiKey.createdAt,
  };
}

export async function toggleApiKeyForUser(userId: string, keyId: string) {
  idSchema.parse({ id: keyId });

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId, revokedAt: null },
  });
  if (!apiKey) {
    throw new Error("ไม่พบ API Key");
  }

  const updated = await db.apiKey.update({
    where: { id: keyId },
    data: { isActive: !apiKey.isActive },
  });

  return { id: updated.id, isActive: updated.isActive };
}

export async function updateApiKeyNameForUser(
  userId: string,
  keyId: string,
  data: unknown,
) {
  idSchema.parse({ id: keyId });
  const input = updateApiKeyNameSchema.parse(data);

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId, revokedAt: null },
  });
  if (!apiKey) {
    throw new Error("ไม่พบ API Key");
  }

  const updated = await db.apiKey.update({
    where: { id: keyId },
    data: { name: input.name },
    select: { id: true, name: true },
  });

  return updated;
}

export async function deleteApiKeyForUser(userId: string, keyId: string) {
  idSchema.parse({ id: keyId });

  const apiKey = await db.apiKey.findFirst({
    where: { id: keyId, userId, revokedAt: null },
  });
  if (!apiKey) {
    throw new Error("ไม่พบ API Key");
  }

  await db.apiKey.update({
    where: { id: keyId },
    data: {
      isActive: false,
      revokedAt: new Date(),
    },
  });
}
