/**
 * RBAC — Dynamic Role-Based Access Control
 * Handles permission checking, Redis caching, system role provisioning.
 */

import { Prisma } from "@prisma/client";
import { prisma as db } from "./db";
import { redis } from "./redis";

// ── Constants ────────────────────────────────────────────

const CACHE_PREFIX = "user_perms";
const CACHE_TTL = 300; // 5 minutes
const LEGACY_MEMBERSHIP_ROLE_TO_SYSTEM_ROLE: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
  API_ONLY: "API-only",
};

export const RBAC_RESOURCES = [
  "sms", "contact", "campaign", "template", "group", "tag",
  "billing", "invoice", "credit", "transaction",
  "api_key", "webhook", "user", "org", "role",
  "audit_log", "ticket", "analytics", "settings",
] as const;

export const RBAC_ACTIONS = ["create", "read", "update", "delete", "manage"] as const;

export type RbacAction = (typeof RBAC_ACTIONS)[number];
export type RbacResource = (typeof RBAC_RESOURCES)[number];

// ── System Role Definitions ──────────────────────────────

type SystemRoleDef = {
  name: string;
  description: string;
  /** Patterns: "action:resource", "*:*", "resource:*", "*:action", "!action:resource" (exclude) */
  patterns: string[];
};

const SYSTEM_ROLES: SystemRoleDef[] = [
  {
    name: "Owner",
    description: "เจ้าของ org — ทำได้ทุกอย่าง",
    patterns: ["*:*"],
  },
  {
    name: "Admin",
    description: "ผู้ดูแลระบบ — ทุกอย่างยกเว้น delete org",
    patterns: ["*:*", "!delete:org"],
  },
  {
    name: "Member",
    description: "สมาชิกทั่วไป — ส่ง SMS, จัดการ contacts",
    patterns: ["sms:*", "contact:*", "campaign:*", "template:*", "group:*", "tag:*"],
  },
  {
    name: "Viewer",
    description: "ดูอย่างเดียว — ไม่แก้ไขอะไร",
    patterns: ["*:read"],
  },
  {
    name: "API-only",
    description: "สำหรับ API access — ไม่มี UI",
    patterns: ["create:sms", "read:sms", "read:contact"],
  },
];

// ── Pattern Expansion ────────────────────────────────────

function expandPatterns(patterns: string[]): Set<string> {
  const all: Array<{ action: string; resource: string }> = [];
  for (const a of RBAC_ACTIONS) {
    for (const r of RBAC_RESOURCES) {
      all.push({ action: a, resource: r });
    }
  }

  const excluded = new Set<string>();
  const included = new Set<string>();

  for (const pattern of patterns) {
    if (pattern.startsWith("!")) {
      const [a, r] = pattern.slice(1).split(":");
      for (const p of all) {
        if ((a === "*" || a === p.action) && (r === "*" || r === p.resource)) {
          excluded.add(`${p.action}:${p.resource}`);
        }
      }
      continue;
    }

    const [left, right] = pattern.split(":");
    for (const p of all) {
      const direct = (left === "*" || left === p.action) && (right === "*" || right === p.resource);
      const reversed = (left === "*" || left === p.resource) && (right === "*" || right === p.action);
      if (direct || reversed) {
        included.add(`${p.action}:${p.resource}`);
      }
    }
  }

  for (const ex of excluded) included.delete(ex);
  return included;
}

// ── System Role Provisioning ─────────────────────────────

/**
 * Create 5 system roles for a new organization.
 * Call this when an org is created. Idempotent.
 */
export async function provisionSystemRoles(organizationId: string): Promise<void> {
  for (const def of SYSTEM_ROLES) {
    const role = await db.role.upsert({
      where: { organizationId_name: { organizationId, name: def.name } },
      update: { description: def.description },
      create: {
        organizationId,
        name: def.name,
        description: def.description,
        isSystemRole: true,
      },
    });

    const expanded = expandPatterns(def.patterns);
    const permIds: string[] = [];
    for (const key of expanded) {
      const [action, resource] = key.split(":");
      const perm = await db.permission.findUnique({
        where: { action_resource: { action, resource } },
      });
      if (perm) permIds.push(perm.id);
    }

    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (permIds.length > 0) {
      await db.rolePermission.createMany({
        data: permIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }
}

/**
 * Assign the "Owner" system role to a user for an org.
 */
export async function assignOwnerRole(userId: string, organizationId: string): Promise<void> {
  const ownerRole = await db.role.findUnique({
    where: { organizationId_name: { organizationId, name: "Owner" } },
  });
  if (!ownerRole) return;

  await db.userRole.upsert({
    where: { userId_roleId_organizationId: { userId, roleId: ownerRole.id, organizationId } },
    update: {},
    create: { userId, roleId: ownerRole.id, organizationId },
  });
}

export async function ensureMembershipRoleAssignment(
  userId: string,
  organizationId: string,
  membershipRole?: string | null,
): Promise<void> {
  const existing = await db.userRole.findFirst({
    where: { userId, organizationId },
    select: { roleId: true },
  });
  if (existing) return;

  const membership =
    membershipRole != null
      ? { role: membershipRole }
      : await db.membership.findUnique({
          where: { userId_organizationId: { userId, organizationId } },
          select: { role: true },
        });

  const roleName = membership?.role
    ? LEGACY_MEMBERSHIP_ROLE_TO_SYSTEM_ROLE[membership.role]
    : null;
  if (!roleName) return;

  let role = await db.role.findUnique({
    where: { organizationId_name: { organizationId, name: roleName } },
    select: { id: true },
  });

  if (!role) {
    await provisionSystemRoles(organizationId);
    role = await db.role.findUnique({
      where: { organizationId_name: { organizationId, name: roleName } },
      select: { id: true },
    });
  }

  if (!role) return;

  try {
    await db.userRole.upsert({
      where: {
        userId_roleId_organizationId: {
          userId,
          roleId: role.id,
          organizationId,
        },
      },
      update: {},
      create: { userId, roleId: role.id, organizationId },
    });
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== "P2002"
    ) {
      throw error;
    }
  }

  await invalidatePermissionCache(userId, organizationId);
}

// ── Permission Checking ──────────────────────────────────

/**
 * Get all permissions for a user in an org.
 * Uses Redis cache with 5min TTL.
 * Returns Set of "action:resource" strings.
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string,
): Promise<Set<string>> {
  await ensureMembershipRoleAssignment(userId, organizationId);

  const cacheKey = `${CACHE_PREFIX}:${userId}:${organizationId}`;

  // Try Redis cache
  try {
    const cached = await redis?.smembers(cacheKey);
    if (cached && cached.length > 0) {
      return new Set(cached);
    }
  } catch {
    // Redis down — fall through to DB
  }

  // Fetch from DB: all roles for this user in this org → union permissions
  const userRoles = await db.userRole.findMany({
    where: { userId, organizationId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const perms = new Set<string>();

  for (const ur of userRoles) {
    // Collect direct permissions
    for (const rp of ur.role.permissions) {
      perms.add(`${rp.permission.action}:${rp.permission.resource}`);
    }

    // Collect inherited permissions (walk up hierarchy)
    let parentId = ur.role.parentRoleId;
    const visited = new Set<string>();
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = await db.role.findUnique({
        where: { id: parentId },
        include: {
          permissions: { include: { permission: true } },
        },
      });
      if (!parent) break;
      for (const rp of parent.permissions) {
        perms.add(`${rp.permission.action}:${rp.permission.resource}`);
      }
      parentId = parent.parentRoleId;
    }
  }

  // Cache in Redis
  try {
    if (redis && perms.size > 0) {
      const pipeline = redis.pipeline();
      pipeline.del(cacheKey);
      pipeline.sadd(cacheKey, ...perms);
      pipeline.expire(cacheKey, CACHE_TTL);
      await pipeline.exec();
    }
  } catch {
    // Cache write failure is non-fatal
  }

  return perms;
}

/**
 * Check if a user has a specific permission in an org.
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  action: RbacAction,
  resource: RbacResource,
): Promise<boolean> {
  const perms = await getUserPermissions(userId, organizationId);
  return perms.has(`${action}:${resource}`);
}

/**
 * Invalidate permission cache for a user in an org.
 * Call after role/permission changes.
 */
export async function invalidatePermissionCache(
  userId: string,
  organizationId: string,
): Promise<void> {
  try {
    await redis?.del(`${CACHE_PREFIX}:${userId}:${organizationId}`);
  } catch {
    // Non-fatal
  }
}

/**
 * Invalidate cache for ALL users in an org (e.g., when a role's permissions change).
 */
export async function invalidateOrgPermissionCache(organizationId: string): Promise<void> {
  try {
    if (!redis) return;
    const pattern = `${CACHE_PREFIX}:*:${organizationId}`;
    let cursor = "0";
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Non-fatal
  }
}

// ── Middleware Helper ─────────────────────────────────────

export type PermissionDeniedResponse = Response;

/**
 * Check permission and return 403 Response if denied, null if allowed.
 * Usage in route handlers:
 *   const denied = await requirePermission(userId, orgId, "create", "sms");
 *   if (denied) return denied;
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  action: RbacAction,
  resource: RbacResource,
): Promise<PermissionDeniedResponse | null> {
  const allowed = await hasPermission(userId, organizationId, action, resource);
  if (allowed) return null;

  return Response.json(
    {
      error: "ไม่มีสิทธิ์ดำเนินการนี้",
      detail: `Required permission: ${action}:${resource}`,
    },
    { status: 403 },
  );
}

/**
 * API route helper: resolve user's default org + check permission in one call.
 * Returns 403 Response if denied, null if allowed.
 * For users without any org membership, permission is always denied.
 */
export async function requireApiPermission(
  userId: string,
  action: RbacAction,
  resource: RbacResource,
): Promise<PermissionDeniedResponse | null> {
  const membership = await db.membership.findFirst({
    where: { userId },
    select: { organizationId: true, role: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    return Response.json(
      { error: "ไม่มีสิทธิ์ — ยังไม่ได้เป็นสมาชิกองค์กร" },
      { status: 403 },
    );
  }

  await ensureMembershipRoleAssignment(
    userId,
    membership.organizationId,
    membership.role,
  );

  return requirePermission(userId, membership.organizationId, action, resource);
}
