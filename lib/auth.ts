import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as argon2 from "argon2";
import { prisma } from "./db";
import { redis } from "./redis";
import { env } from "./env";
import { logger } from "./logger";
import { getClientIp, hashToken, parseUserAgent } from "./session-utils";

// Detect if Bun runtime is available (Next.js dev uses Node, not Bun)
const hasBunRuntime = typeof globalThis.Bun !== "undefined";

const JWT_SECRET = env.JWT_SECRET;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "30d";
const ACCESS_COOKIE_NAME = "session";
const REFRESH_COOKIE_NAME = "refresh_token";
const MAX_CONCURRENT_SESSIONS = 5;

type TokenKind = "access" | "refresh";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string | null;
  securityVersion: number;
  sessionId: string;
};

type SessionTokenPayload = {
  uid: string;
  orgId: string | null;
  role: string;
  sid: string;
  jti: string;
  securityVersion: number;
  type: TokenKind;
  iat?: number;
  exp?: number;
};

type SessionRecord = {
  userId: string;
  sessionId: string;
  refreshTokenHash: string;
  ip: string;
  userAgent: string;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  createdAt: string;
  lastActiveAt: string;
  organizationId: string | null;
  role: string;
  securityVersion: number;
};

type SessionIssueOptions = {
  headers?: Headers | null;
};

type SessionContext = {
  user: SessionUser;
  payload: SessionTokenPayload;
  session: SessionRecord;
};

type RefreshResult = SessionContext & {
  refreshed: true;
};

type SessionLookupOptions = SessionIssueOptions & {
  allowExpiredAccess?: boolean;
};

function sessionKey(userId: string, sessionId: string) {
  return `user:${userId}:session:${sessionId}`;
}

function userSessionsKey(userId: string) {
  return `user:${userId}:sessions`;
}

function denylistKey(jti: string) {
  return `denylist:${jti}`;
}

function generateSessionId() {
  return `c${randomBytes(12).toString("hex")}`;
}

function readTokenExpirySeconds(payload: SessionTokenPayload | null) {
  if (!payload?.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

async function loadSessionUser(userId: string): Promise<Omit<SessionUser, "sessionId"> | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      securityVersion: true,
    },
  });

  if (!user) return null;

  let organizationId: string | null = null;
  try {
    const { ensureUserWorkspace } = await import("./rbac");
    const workspace = await ensureUserWorkspace(userId);
    organizationId = workspace.organizationId;
  } catch (err) {
    logger.error("ensureUserWorkspace failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { organizationId: true },
    });
    organizationId = membership?.organizationId ?? null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId,
    securityVersion: user.securityVersion,
  };
}

function isSessionTokenPayload(value: unknown, type: TokenKind): value is SessionTokenPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  return (
    typeof payload.uid === "string" &&
    (typeof payload.orgId === "string" || payload.orgId === null) &&
    typeof payload.role === "string" &&
    typeof payload.sid === "string" &&
    typeof payload.jti === "string" &&
    typeof payload.securityVersion === "number" &&
    payload.type === type
  );
}

function verifySessionToken(
  token: string,
  type: TokenKind,
  options?: { ignoreExpiration?: boolean },
): SessionTokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      ignoreExpiration: options?.ignoreExpiration ?? false,
    });
    return isSessionTokenPayload(payload, type) ? payload : null;
  } catch {
    return null;
  }
}

function signSessionToken(payload: SessionTokenPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: payload.type === "access" ? ACCESS_TOKEN_EXPIRES_IN : REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function signToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const accessPayload = verifySessionToken(token, "access", { ignoreExpiration: false });
  if (accessPayload) return { userId: accessPayload.uid };

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    return typeof payload.userId === "string" ? payload as { userId: string } : null;
  } catch {
    return null;
  }
}

function buildTokenPayload(
  user: Omit<SessionUser, "sessionId">,
  sessionId: string,
  type: TokenKind,
): SessionTokenPayload {
  return {
    uid: user.id,
    orgId: user.organizationId,
    role: user.role,
    sid: sessionId,
    jti: crypto.randomUUID(),
    securityVersion: user.securityVersion,
    type,
  };
}

function buildSessionRecord(
  user: Omit<SessionUser, "sessionId">,
  sessionId: string,
  refreshToken: string,
  headers?: Headers | null,
): SessionRecord {
  const userAgent = headers?.get("user-agent") ?? "";
  const device = parseUserAgent(userAgent || null);
  const now = new Date().toISOString();

  return {
    userId: user.id,
    sessionId,
    refreshTokenHash: hashToken(refreshToken),
    ip: headers ? getClientIp(headers) : "unknown",
    userAgent,
    deviceName: device.deviceName,
    deviceType: device.deviceType,
    browser: device.browser,
    os: device.os,
    createdAt: now,
    lastActiveAt: now,
    organizationId: user.organizationId,
    role: user.role,
    securityVersion: user.securityVersion,
  };
}

async function persistSessionRecord(record: SessionRecord) {
  await Promise.all([
    redis.set(
      sessionKey(record.userId, record.sessionId),
      JSON.stringify(record),
      "EX",
      REFRESH_TOKEN_TTL_SECONDS,
    ),
    redis.sadd(userSessionsKey(record.userId), record.sessionId),
    redis.expire(userSessionsKey(record.userId), REFRESH_TOKEN_TTL_SECONDS),
    prisma.userSession.upsert({
      where: { id: record.sessionId },
      update: {
        tokenHash: record.refreshTokenHash,
        deviceName: record.deviceName,
        deviceType: record.deviceType,
        browser: record.browser,
        os: record.os,
        ipAddress: record.ip,
        lastActiveAt: new Date(record.lastActiveAt),
      },
      create: {
        id: record.sessionId,
        userId: record.userId,
        tokenHash: record.refreshTokenHash,
        deviceName: record.deviceName,
        deviceType: record.deviceType,
        browser: record.browser,
        os: record.os,
        ipAddress: record.ip,
        lastActiveAt: new Date(record.lastActiveAt),
        createdAt: new Date(record.createdAt),
      },
    }),
  ]);

  const existingSessions = await prisma.userSession.findMany({
    where: { userId: record.userId },
    orderBy: [
      { createdAt: "asc" },
      { lastActiveAt: "asc" },
    ],
    select: { id: true },
  });

  const sessionsToPrune = existingSessions.slice(
    0,
    Math.max(0, existingSessions.length - MAX_CONCURRENT_SESSIONS),
  );

  if (sessionsToPrune.length > 0) {
    await Promise.all(
      sessionsToPrune.map((session: (typeof sessionsToPrune)[number]) => deleteSessionRecord(record.userId, session.id)),
    );
  }
}

async function readSessionRecord(userId: string, sessionId: string) {
  const raw = await redis.get(sessionKey(userId, sessionId));
  if (!raw || typeof raw !== "string") return null;

  try {
    const parsed = JSON.parse(raw) as SessionRecord;
    if (parsed.userId !== userId || parsed.sessionId !== sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function updateSessionRecord(record: SessionRecord) {
  const ttl = await redis.ttl(sessionKey(record.userId, record.sessionId));
  const ttlSeconds = ttl > 0 ? ttl : REFRESH_TOKEN_TTL_SECONDS;
  await Promise.all([
    redis.set(
      sessionKey(record.userId, record.sessionId),
      JSON.stringify(record),
      "EX",
      ttlSeconds,
    ),
    prisma.userSession.updateMany({
      where: {
        id: record.sessionId,
        userId: record.userId,
      },
      data: {
        tokenHash: record.refreshTokenHash,
        deviceName: record.deviceName,
        deviceType: record.deviceType,
        browser: record.browser,
        os: record.os,
        ipAddress: record.ip,
        lastActiveAt: new Date(record.lastActiveAt),
      },
    }),
  ]);
}

async function deleteSessionRecord(userId: string, sessionId: string) {
  await Promise.all([
    redis.del(sessionKey(userId, sessionId)),
    redis.srem(userSessionsKey(userId), sessionId),
    prisma.userSession.deleteMany({
      where: { id: sessionId, userId },
    }),
  ]);
}

async function denylistAccessToken(jti: string, ttlSeconds: number) {
  if (!jti) return;
  const ttl = ttlSeconds > 0 ? ttlSeconds : ACCESS_TOKEN_TTL_SECONDS;
  await redis.set(denylistKey(jti), "1", "EX", ttl);
}

async function isAccessTokenDenied(jti: string) {
  const denied = await redis.get(denylistKey(jti));
  return denied != null;
}

function writeSessionCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  return cookieStore.then((store) => {
    store.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
      path: "/",
    });

    store.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
      path: "/",
    });
  });
}

async function writeAccessCookie(accessToken: string) {
  try {
    const store = await cookies();
    store.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
      path: "/",
    });
    return true;
  } catch {
    return false;
  }
}

export async function hashPassword(password: string) {
  if (hasBunRuntime) {
    return Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 19456, // 19 MiB (OWASP recommended)
      timeCost: 2,
    });
  }
  // Node.js fallback: argon2id via argon2 package (OWASP recommended params)
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

/**
 * Verify password — supports both argon2id and legacy bcrypt hashes.
 */
export async function verifyPassword(password: string, hash: string) {
  if (hasBunRuntime) {
    return Bun.password.verify(password, hash);
  }
  // Node.js fallback: argon2 package for argon2id, bcryptjs for legacy bcrypt
  if (hash.startsWith("$argon2")) {
    return argon2.verify(hash, password);
  }
  return bcrypt.compare(password, hash);
}

/**
 * Check if a hash needs rehash (legacy bcrypt → argon2id migration).
 */
export function needsRehash(hash: string): boolean {
  return !hash.startsWith("$argon2id$");
}

/**
 * Verify + lazy-migrate: if password is valid but hash is bcrypt,
 * returns the new argon2id hash for the caller to persist.
 */
export async function verifyAndMigratePassword(
  password: string,
  currentHash: string,
): Promise<{ valid: boolean; newHash?: string }> {
  const valid = await verifyPassword(password, currentHash);
  if (!valid) return { valid: false };

  if (needsRehash(currentHash)) {
    const newHash = await hashPassword(password);
    return { valid: true, newHash };
  }

  return { valid: true };
}

export async function setSession(userId: string, options: SessionIssueOptions = {}) {
  const user = await loadSessionUser(userId);
  if (!user) {
    throw new Error("ไม่พบผู้ใช้");
  }

  const sessionId = generateSessionId();
  const accessPayload = buildTokenPayload(user, sessionId, "access");
  const refreshPayload = buildTokenPayload(user, sessionId, "refresh");
  const accessToken = signSessionToken(accessPayload);
  const refreshToken = signSessionToken(refreshPayload);
  const record = buildSessionRecord(user, sessionId, refreshToken, options.headers);

  await persistSessionRecord(record);
  await writeSessionCookies(accessToken, refreshToken);

  return {
    user: {
      ...user,
      sessionId,
    },
    sessionId,
  };
}

async function validateAccessPayload(payload: SessionTokenPayload): Promise<SessionContext | null> {
  if (await isAccessTokenDenied(payload.jti)) {
    return null;
  }

  const [record, user] = await Promise.all([
    readSessionRecord(payload.uid, payload.sid),
    loadSessionUser(payload.uid),
  ]);

  if (!record || !user) {
    return null;
  }

  if (
    user.securityVersion !== payload.securityVersion ||
    record.securityVersion !== user.securityVersion
  ) {
    return null;
  }

  return {
    user: {
      ...user,
      sessionId: payload.sid,
    },
    payload,
    session: record,
  };
}

async function validateRefreshPayload(
  payload: SessionTokenPayload,
  refreshToken: string,
): Promise<SessionContext | null> {
  const [record, user] = await Promise.all([
    readSessionRecord(payload.uid, payload.sid),
    loadSessionUser(payload.uid),
  ]);

  if (!record || !user) {
    return null;
  }

  if (
    hashToken(refreshToken) !== record.refreshTokenHash ||
    user.securityVersion !== payload.securityVersion ||
    record.securityVersion !== user.securityVersion
  ) {
    await deleteSessionRecord(payload.uid, payload.sid).catch(() => {});
    return null;
  }

  return {
    user: {
      ...user,
      sessionId: payload.sid,
    },
    payload,
    session: record,
  };
}

async function readCurrentAccessContext(options?: { allowExpired?: boolean }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token, "access", {
    ignoreExpiration: options?.allowExpired ?? false,
  });
  if (!payload) return null;

  return validateAccessPayload(payload);
}

async function readCurrentRefreshContext() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  const payload = verifySessionToken(refreshToken, "refresh");
  if (!payload) return null;

  return validateRefreshPayload(payload, refreshToken);
}

async function renewAccessFromRefresh(
  options: SessionIssueOptions = {},
): Promise<SessionContext | null> {
  const context = await readCurrentRefreshContext();
  if (!context) return null;

  const accessPayload = buildTokenPayload(
    {
      id: context.user.id,
      name: context.user.name,
      email: context.user.email,
      role: context.user.role,
      organizationId: context.user.organizationId,
      securityVersion: context.user.securityVersion,
    },
    context.user.sessionId,
    "access",
  );

  const accessToken = signSessionToken(accessPayload);
  const wroteAccessCookie = await writeAccessCookie(accessToken);
  if (!wroteAccessCookie) {
    return {
      ...context,
      payload: accessPayload,
    };
  }

  const nextRecord: SessionRecord = {
    ...context.session,
    lastActiveAt: new Date().toISOString(),
  };

  if (options.headers) {
    nextRecord.ip = getClientIp(options.headers);
    nextRecord.userAgent = options.headers.get("user-agent") ?? context.session.userAgent;
    const device = parseUserAgent(options.headers.get("user-agent"));
    nextRecord.deviceName = device.deviceName;
    nextRecord.deviceType = device.deviceType;
    nextRecord.browser = device.browser;
    nextRecord.os = device.os;
  }

  await updateSessionRecord(nextRecord).catch(() => {});

  return {
    user: context.user,
    payload: accessPayload,
    session: nextRecord,
  };
}

export async function getSession(options: SessionLookupOptions = {}) {
  const session = await getSessionContext(options);
  return session?.user ?? null;
}

export async function getSessionContext(options: SessionLookupOptions = {}) {
  const accessContext = await readCurrentAccessContext({
    allowExpired: options.allowExpiredAccess,
  });
  if (accessContext) {
    return accessContext;
  }

  return renewAccessFromRefresh(options);
}

async function refreshFromRefreshToken(options: SessionIssueOptions = {}): Promise<RefreshResult | null> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;

  const payload = verifySessionToken(refreshToken, "refresh");
  if (!payload) return null;

  const context = await validateRefreshPayload(payload, refreshToken);
  if (!context) {
    return null;
  }

  const accessPayload = buildTokenPayload(
    {
      id: context.user.id,
      name: context.user.name,
      email: context.user.email,
      role: context.user.role,
      organizationId: context.user.organizationId,
      securityVersion: context.user.securityVersion,
    },
    payload.sid,
    "access",
  );
  const nextRefreshPayload = buildTokenPayload(
    {
      id: context.user.id,
      name: context.user.name,
      email: context.user.email,
      role: context.user.role,
      organizationId: context.user.organizationId,
      securityVersion: context.user.securityVersion,
    },
    payload.sid,
    "refresh",
  );
  const accessToken = signSessionToken(accessPayload);
  const nextRefreshToken = signSessionToken(nextRefreshPayload);
  const nextRecord: SessionRecord = {
    ...context.session,
    refreshTokenHash: hashToken(nextRefreshToken),
    ip: options.headers ? getClientIp(options.headers) : context.session.ip,
    userAgent: options.headers?.get("user-agent") ?? context.session.userAgent,
    securityVersion: context.user.securityVersion,
    organizationId: context.user.organizationId,
    role: context.user.role,
    lastActiveAt: new Date().toISOString(),
  };

  if (options.headers) {
    const device = parseUserAgent(options.headers.get("user-agent"));
    nextRecord.deviceName = device.deviceName;
    nextRecord.deviceType = device.deviceType;
    nextRecord.browser = device.browser;
    nextRecord.os = device.os;
  }

  await updateSessionRecord(nextRecord);
  await writeSessionCookies(accessToken, nextRefreshToken);

  return {
    refreshed: true,
    user: {
      ...context.user,
      sessionId: payload.sid,
    },
    payload: accessPayload,
    session: nextRecord,
  };
}

export async function refreshSession(options: SessionIssueOptions = {}) {
  return refreshFromRefreshToken(options);
}

export async function verifyOrRefreshSession(options: SessionIssueOptions = {}) {
  const active = await readCurrentAccessContext();
  if (active) {
    const now = Date.now();
    const lastActiveAt = new Date(active.session.lastActiveAt).getTime();
    if (Number.isFinite(lastActiveAt) && now - lastActiveAt > 30_000) {
      void updateSessionRecord({
        ...active.session,
        lastActiveAt: new Date(now).toISOString(),
      }).catch(() => {});
    }

    return {
      ...active,
      refreshed: false,
    };
  }

  return refreshFromRefreshToken(options);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
}

export async function logoutCurrentSession() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  const accessPayload = accessToken
    ? verifySessionToken(accessToken, "access", { ignoreExpiration: true })
    : null;
  const refreshPayload = refreshToken
    ? verifySessionToken(refreshToken, "refresh", { ignoreExpiration: true })
    : null;
  const payload = accessPayload ?? refreshPayload;

  if (payload) {
    await deleteSessionRecord(payload.uid, payload.sid).catch(() => {});
  }

  if (accessPayload) {
    await denylistAccessToken(accessPayload.jti, readTokenExpirySeconds(accessPayload)).catch(() => {});
  }

  await clearSession();
}

export async function revokeAllUserSessions(
  userId: string,
  options?: {
    exceptSessionId?: string | null;
    incrementSecurityVersion?: boolean;
  },
) {
  if (options?.incrementSecurityVersion) {
    await prisma.user.update({
      where: { id: userId },
      data: { securityVersion: { increment: 1 } },
    });
  }

  const sessionIds = await redis.smembers(userSessionsKey(userId));
  const targetIds = sessionIds.filter((sessionId) => sessionId !== options?.exceptSessionId);

  if (targetIds.length > 0) {
    await Promise.all(targetIds.map((sessionId) => deleteSessionRecord(userId, sessionId)));
  }

  await prisma.userSession.deleteMany({
    where: {
      userId,
      ...(options?.exceptSessionId
        ? { id: { not: options.exceptSessionId } }
        : {}),
    },
  }).catch(() => {});

  return targetIds.length;
}

export async function revokeUserSession(userId: string, sessionId: string) {
  const record = await readSessionRecord(userId, sessionId);
  if (!record) return false;

  await deleteSessionRecord(userId, sessionId);
  return true;
}

export async function listUserSessions(userId: string, currentSessionId?: string | null) {
  const sessionIds = await redis.smembers(userSessionsKey(userId));
  const records = await Promise.all(sessionIds.map((sessionId) => readSessionRecord(userId, sessionId)));

  const staleSessionIds: string[] = [];
  const sessions = records.flatMap((record, index) => {
    if (!record) {
      staleSessionIds.push(sessionIds[index]);
      return [];
    }

    return [{
      id: record.sessionId,
      deviceName: record.deviceName,
      deviceType: record.deviceType,
      browser: record.browser,
      os: record.os,
      ipAddress: record.ip,
      location: null,
      lastActiveAt: record.lastActiveAt,
      createdAt: record.createdAt,
      isCurrent: record.sessionId === currentSessionId,
    }];
  });

  if (staleSessionIds.length > 0) {
    await redis.srem(userSessionsKey(userId), ...staleSessionIds).catch(() => {});
  }

  return sessions.sort((left, right) =>
    new Date(right.lastActiveAt).getTime() - new Date(left.lastActiveAt).getTime(),
  );
}

export async function getCurrentSessionRecord() {
  const context = await getSessionContext();
  return context?.session ?? null;
}

export async function getCurrentSessionId(options?: { allowExpiredAccess?: boolean }) {
  const context = await getSessionContext(options);
  return context?.payload.sid ?? null;
}
