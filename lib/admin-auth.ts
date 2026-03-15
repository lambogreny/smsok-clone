import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { prisma as db } from "./db";
import { ApiError } from "./api-auth";
import jwt from "jsonwebtoken";
import { verifyAndMigratePassword } from "./auth";
import { env } from "./env";
import { hasValidCsrfOrigin } from "./csrf";
import { redis } from "./redis";

const ADMIN_JWT_SECRET = env.JWT_SECRET + "_admin";
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const ADMIN_SESSION_COOKIE_NAME = "admin_session";
const DUMMY_HASH = "$2b$12$qF1xea/GGCtjbQ6FC32FAu0YSQWxmgOuBDgvb4IVBhTrnjXPVYwoC";

type AdminPayload = {
  type: "admin";
  adminId: string;
  role: string;
  sessionId: string;
  jti: string;
};

type AdminSessionRecord = {
  adminId: string;
};

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  sessionId: string;
};

function buildAdminSessionKey(sessionId: string) {
  return `admin_session:${sessionId}`;
}

export function signAdminToken(adminId: string, role: string, sessionId: string) {
  return jwt.sign(
    { type: "admin", adminId, role, sessionId, jti: randomUUID() },
    ADMIN_JWT_SECRET,
    { expiresIn: `${ADMIN_SESSION_TTL_SECONDS}s` },
  );
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
    if (
      payload?.type !== "admin" ||
      !payload?.adminId ||
      !payload?.role ||
      !payload?.sessionId ||
      !payload?.jti
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function createAdminSession(adminId: string) {
  const sessionId = randomUUID();
  await redis.set(
    buildAdminSessionKey(sessionId),
    JSON.stringify({ adminId }),
    "EX",
    ADMIN_SESSION_TTL_SECONDS,
  );
  return sessionId;
}

async function getAdminSession(sessionId: string): Promise<AdminSessionRecord | null> {
  const rawSession = await redis.get(buildAdminSessionKey(sessionId));
  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as AdminSessionRecord;
    if (!session?.adminId) {
      return null;
    }
    return session;
  } catch {
    await redis.del(buildAdminSessionKey(sessionId)).catch(() => undefined);
    return null;
  }
}

async function touchAdminSession(sessionId: string) {
  await redis.expire(buildAdminSessionKey(sessionId), ADMIN_SESSION_TTL_SECONDS).catch(() => undefined);
}

export async function revokeAdminSession(sessionId: string) {
  await redis.del(buildAdminSessionKey(sessionId));
}

function isSafeMethod(method: string) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

export async function authenticateAdminToken(
  token: string,
  allowedRoles?: string[],
): Promise<AuthenticatedAdmin> {
  const payload = verifyAdminToken(token);
  if (!payload) {
    throw new ApiError(401, "Invalid or expired admin token", "ADMIN_AUTH_INVALID");
  }

  const session = await getAdminSession(payload.sessionId);
  if (!session || session.adminId !== payload.adminId) {
    throw new ApiError(401, "Invalid or expired admin token", "ADMIN_AUTH_INVALID");
  }

  const admin = await db.adminUser.findUnique({
    where: { id: payload.adminId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!admin || !admin.isActive) {
    throw new ApiError(401, "Admin account not found or disabled", "ADMIN_AUTH_DISABLED");
  }

  if (allowedRoles && !allowedRoles.includes(admin.role) && admin.role !== "SUPER_ADMIN") {
    throw new ApiError(403, "ไม่มีสิทธิ์ดำเนินการนี้", "ADMIN_FORBIDDEN");
  }

  void touchAdminSession(payload.sessionId);
  return { ...admin, sessionId: payload.sessionId };
}

/**
 * Authenticate admin via Bearer token or cookie
 * Returns admin user with role
 */
export async function authenticateAdmin(req: NextRequest, allowedRoles?: string[]) {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const cookieToken = req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value;
  const token = bearerToken || cookieToken;

  if (!token) {
    throw new ApiError(401, "Admin authentication required", "ADMIN_AUTH_MISSING");
  }

  if (!bearerToken && !isSafeMethod(req.method) && !hasValidCsrfOrigin(req)) {
    throw new ApiError(403, "CSRF: invalid origin", "ADMIN_CSRF_INVALID");
  }

  return authenticateAdminToken(token, allowedRoles);
}

export async function loginAdmin(email: string, password: string) {
  const admin = await db.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, password: true, role: true, isActive: true },
  });
  const passwordHash = admin?.isActive ? admin.password : DUMMY_HASH;
  const { valid, newHash } = await verifyAndMigratePassword(password, passwordHash);

  if (!admin || !admin.isActive || !valid) {
    throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  // Update last login + lazy migrate bcrypt → argon2id
  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLogin: new Date(), ...(newHash ? { password: newHash } : {}) },
  });

  const sessionId = await createAdminSession(admin.id);
  const token = signAdminToken(admin.id, admin.role, sessionId);
  return {
    token,
    sessionId,
    admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  };
}

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}
