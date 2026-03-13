import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");
const schemaSource = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const authSource = readFileSync(resolve(ROOT, "lib/auth.ts"), "utf-8");
const middlewareSource = readFileSync(resolve(ROOT, "middleware.ts"), "utf-8");
const verifySessionRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/verify-session/route.ts"),
  "utf-8",
);
const logoutRouteSource = readFileSync(resolve(ROOT, "app/api/auth/logout/route.ts"), "utf-8");
const logoutAllRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/logout-all/route.ts"),
  "utf-8",
);
const sessionsRouteSource = readFileSync(resolve(ROOT, "app/api/auth/sessions/route.ts"), "utf-8");
const sessionDetailRouteSource = readFileSync(
  resolve(ROOT, "app/api/auth/sessions/[sid]/route.ts"),
  "utf-8",
);

describe("Task #1783: session management core", () => {
  it("tracks security_version and persisted session metadata in the schema", () => {
    expect(schemaSource).toContain('securityVersion     Int                 @default(1) @map("security_version")');
    expect(schemaSource).toContain("model UserSession {");
    expect(schemaSource).toContain('@@map("user_sessions")');
  });

  it("stores Redis-backed session records, denylists access tokens, and rotates refresh sessions", () => {
    expect(authSource).toContain("const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;");
    expect(authSource).toContain("const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;");
    expect(authSource).toContain('return `user:${userId}:session:${sessionId}`;');
    expect(authSource).toContain('return `user:${userId}:sessions`;');
    expect(authSource).toContain('return `denylist:${jti}`;');
    expect(authSource).toContain("redis.set(");
    expect(authSource).toContain("denylistAccessToken");
    expect(authSource).toContain("refreshFromRefreshToken");
    expect(authSource).toContain("verifyOrRefreshSession");
    expect(authSource).toContain("revokeAllUserSessions(");
    expect(authSource).toContain("export async function revokeUserSession(userId: string, sessionId: string)");
    expect(authSource).toContain("export async function listUserSessions(userId: string, currentSessionId?: string | null)");
  });

  it("exposes verify-session, logout, logout-all, and per-session revoke routes", () => {
    expect(verifySessionRouteSource).toContain("verifyOrRefreshSession({ headers: req.headers })");
    expect(verifySessionRouteSource).toContain("refreshed: result.refreshed");
    expect(verifySessionRouteSource).toContain("sessionId: result.user.sessionId");
    expect(logoutRouteSource).toContain("logoutCurrentSession()");
    expect(logoutAllRouteSource).toContain("revokeAllUserSessions(result.user.id");
    expect(logoutAllRouteSource).toContain("incrementSecurityVersion: true");
    expect(sessionsRouteSource).toContain("listUserSessions(result.user.id, result.user.sessionId)");
    expect(sessionDetailRouteSource).toContain("revokeUserSession(result.user.id, sid)");
  });

  it("uses JWT verification in middleware without self-fetching verify-session", () => {
    expect(middlewareSource).toContain("verifySessionJwt");
    expect(middlewareSource).toContain("const hasValidRefreshToken = refreshToken");
    expect(middlewareSource).not.toContain("/api/auth/verify-session");
  });
});
