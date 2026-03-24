
import { prisma as db } from "../db";
import {
  requirePermission,
  hasPermission,
  invalidatePermissionCache,
  invalidateOrgPermissionCache,
  RBAC_ACTIONS,
  RBAC_RESOURCES,
  type RbacAction,
  type RbacResource,
} from "../rbac";
import { ApiError } from "../api-auth";
import { z } from "zod";

// ── Helpers ──────────────────────────────────────────────

async function assertOrgMember(userId: string, organizationId: string) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });
  if (!membership) {
    throw new ApiError(403, "ไม่ได้เป็นสมาชิกขององค์กรนี้");
  }
  return membership;
}

async function logRbacAction(
  organizationId: string,
  userId: string,
  action: string,
  resource: string,
  resourceId: string | null,
  metadata: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      metadata: metadata as Parameters<typeof db.auditLog.create>[0]["data"]["metadata"],
      result: "success",
    },
  });
}

// ── Schemas ──────────────────────────────────────────────

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  parentRoleId: z.string().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  parentRoleId: z.string().nullable().optional(),
});

const setPermissionsSchema = z.object({
  permissions: z.array(z.object({
    action: z.enum(RBAC_ACTIONS as unknown as [string, ...string[]]),
    resource: z.enum(RBAC_RESOURCES as unknown as [string, ...string[]]),
  })),
});

const assignRoleSchema = z.object({
  roleId: z.string().min(1),
});

// ── Roles CRUD ───────────────────────────────────────────

export async function listRoles(userId: string, organizationId: string) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "read", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์ดูรายการ roles");

  return db.role.findMany({
    where: { organizationId },
    include: {
      _count: { select: { userRoles: true, permissions: true } },
      parentRole: { select: { id: true, name: true } },
    },
    orderBy: [{ isSystemRole: "desc" }, { name: "asc" }],
  });
}

export async function getRole(userId: string, organizationId: string, roleId: string) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "read", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์ดู role");

  const role = await db.role.findFirst({
    where: { id: roleId, organizationId },
    include: {
      permissions: {
        include: { permission: true },
      },
      userRoles: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      parentRole: { select: { id: true, name: true } },
    },
  });
  if (!role) throw new ApiError(404, "ไม่พบ role");
  return role;
}

export async function createRole(userId: string, organizationId: string, data: unknown) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "create", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์สร้าง role");

  const input = createRoleSchema.parse(data);

  // Check parent role belongs to same org
  if (input.parentRoleId) {
    const parent = await db.role.findFirst({
      where: { id: input.parentRoleId, organizationId },
    });
    if (!parent) throw new ApiError(400, "Parent role ไม่พบหรือไม่อยู่ใน org เดียวกัน");
  }

  const role = await db.role.create({
    data: {
      organizationId,
      name: input.name,
      description: input.description,
      parentRoleId: input.parentRoleId,
      isSystemRole: false,
    },
  });

  await logRbacAction(organizationId, userId, "role.create", "Role", role.id, {
    name: role.name,
  });

  return role;
}

export async function updateRole(
  userId: string,
  organizationId: string,
  roleId: string,
  data: unknown,
) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "update", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์แก้ไข role");

  const existing = await db.role.findFirst({
    where: { id: roleId, organizationId },
  });
  if (!existing) throw new ApiError(404, "ไม่พบ role");

  const input = updateRoleSchema.parse(data);

  // Prevent renaming system roles
  if (existing.isSystemRole && input.name && input.name !== existing.name) {
    throw new ApiError(400, "ไม่สามารถเปลี่ยนชื่อ system role ได้");
  }

  // Check parent role + transitive cycle detection
  if (input.parentRoleId) {
    if (input.parentRoleId === roleId) {
      throw new ApiError(400, "Role ไม่สามารถเป็น parent ของตัวเอง");
    }
    const parent = await db.role.findFirst({
      where: { id: input.parentRoleId, organizationId },
    });
    if (!parent) throw new ApiError(400, "Parent role ไม่พบ");

    // Walk up the chain to detect cycles (A→B→C→A)
    const visited = new Set<string>([roleId]);
    let current: string | null = input.parentRoleId;
    while (current) {
      if (visited.has(current)) {
        throw new ApiError(400, "ไม่สามารถตั้ง parent role เป็นวงกลม (cycle detected)");
      }
      visited.add(current);
      const ancestor: { parentRoleId: string | null } | null = await db.role.findUnique({
        where: { id: current },
        select: { parentRoleId: true },
      });
      current = ancestor?.parentRoleId ?? null;
    }
  }

  const updated = await db.role.update({
    where: { id: roleId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.parentRoleId !== undefined && { parentRoleId: input.parentRoleId }),
    },
  });

  await invalidateOrgPermissionCache(organizationId);
  await logRbacAction(organizationId, userId, "role.update", "Role", roleId, {
    changes: input,
  });

  return updated;
}

export async function deleteRole(userId: string, organizationId: string, roleId: string) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "delete", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์ลบ role");

  const role = await db.role.findFirst({
    where: { id: roleId, organizationId },
  });
  if (!role) throw new ApiError(404, "ไม่พบ role");
  if (role.isSystemRole) throw new ApiError(400, "ไม่สามารถลบ system role ได้");

  // Check if role has users assigned
  const assignedCount = await db.userRole.count({ where: { roleId } });
  if (assignedCount > 0) {
    throw new ApiError(400, `ยังมี ${assignedCount} ผู้ใช้ที่ใช้ role นี้อยู่ กรุณา unassign ก่อน`);
  }

  await db.role.delete({ where: { id: roleId } });
  await invalidateOrgPermissionCache(organizationId);
  await logRbacAction(organizationId, userId, "role.delete", "Role", roleId, {
    name: role.name,
  });
}

// ── Role Permissions ─────────────────────────────────────

export async function getRolePermissions(
  userId: string,
  organizationId: string,
  roleId: string,
) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "read", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์ดู permissions");

  const role = await db.role.findFirst({
    where: { id: roleId, organizationId },
  });
  if (!role) throw new ApiError(404, "ไม่พบ role");

  const rolePerms = await db.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });

  return {
    roleId,
    roleName: role.name,
    permissions: rolePerms.map((rp: (typeof rolePerms)[number]) => ({
      id: rp.permission.id,
      action: rp.permission.action,
      resource: rp.permission.resource,
    })),
  };
}

export async function setRolePermissions(
  userId: string,
  organizationId: string,
  roleId: string,
  data: unknown,
) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "manage", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์จัดการ permissions");

  const role = await db.role.findFirst({
    where: { id: roleId, organizationId },
  });
  if (!role) throw new ApiError(404, "ไม่พบ role");

  const input = setPermissionsSchema.parse(data);

  // Resolve permission IDs
  const permIds: string[] = [];
  for (const { action, resource } of input.permissions) {
    const perm = await db.permission.findUnique({
      where: { action_resource: { action, resource } },
    });
    if (perm) permIds.push(perm.id);
  }

  // Replace all permissions in transaction
  await db.$transaction([
    db.rolePermission.deleteMany({ where: { roleId } }),
    ...(permIds.length > 0
      ? [db.rolePermission.createMany({
          data: permIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        })]
      : []),
  ]);

  await invalidateOrgPermissionCache(organizationId);
  await logRbacAction(organizationId, userId, "role.permissions.set", "Role", roleId, {
    roleName: role.name,
    permissionCount: permIds.length,
  });

  return { roleId, permissionCount: permIds.length };
}

// ── User-Role Assignment ─────────────────────────────────

export async function assignRole(
  userId: string,
  organizationId: string,
  targetUserId: string,
  data: unknown,
) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "manage", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์กำหนด role");

  const input = assignRoleSchema.parse(data);

  // Verify role belongs to org
  const role = await db.role.findFirst({
    where: { id: input.roleId, organizationId },
  });
  if (!role) throw new ApiError(404, "ไม่พบ role ใน org นี้");

  // Verify target user is member of org
  const targetMembership = await db.membership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } },
  });
  if (!targetMembership) throw new ApiError(400, "ผู้ใช้ไม่ได้เป็นสมาชิกขององค์กรนี้");

  // Prevent assigning Owner role if not Owner
  if (role.name === "Owner") {
    const isOwner = await hasPermission(userId, organizationId, "delete", "org");
    if (!isOwner) {
      throw new ApiError(403, "เฉพาะ Owner เท่านั้นที่สามารถกำหนด Owner role ได้");
    }
  }

  await db.userRole.upsert({
    where: { userId_roleId_organizationId: { userId: targetUserId, roleId: input.roleId, organizationId } },
    update: {},
    create: { userId: targetUserId, roleId: input.roleId, organizationId },
  });

  await invalidatePermissionCache(targetUserId, organizationId);
  await logRbacAction(organizationId, userId, "role.assign", "UserRole", null, {
    targetUserId,
    roleId: input.roleId,
    roleName: role.name,
  });

  return { success: true, userId: targetUserId, roleId: input.roleId, roleName: role.name };
}

export async function unassignRole(
  userId: string,
  organizationId: string,
  targetUserId: string,
  roleId: string,
) {
  await assertOrgMember(userId, organizationId);
  const denied = await requirePermission(userId, organizationId, "manage", "role");
  if (denied) throw new ApiError(403, "ไม่มีสิทธิ์ถอด role");

  const role = await db.role.findFirst({
    where: { id: roleId, organizationId },
  });
  if (!role) throw new ApiError(404, "ไม่พบ role");

  // Prevent removing last Owner
  if (role.name === "Owner") {
    const ownerCount = await db.userRole.count({
      where: { roleId, organizationId },
    });
    if (ownerCount <= 1) {
      throw new ApiError(400, "ต้องมี Owner อย่างน้อย 1 คน ไม่สามารถถอดได้");
    }
  }

  await db.userRole.delete({
    where: { userId_roleId_organizationId: { userId: targetUserId, roleId, organizationId } },
  }).catch(() => {
    throw new ApiError(404, "ไม่พบ user-role assignment นี้");
  });

  await invalidatePermissionCache(targetUserId, organizationId);
  await logRbacAction(organizationId, userId, "role.unassign", "UserRole", null, {
    targetUserId,
    roleId,
    roleName: role.name,
  });

  return { success: true };
}

// ── List All Permissions (for UI checkbox matrix) ────────

export async function listPermissions() {
  return db.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });
}

// ── Get User's Effective Permissions ─────────────────────

export async function getUserEffectivePermissions(
  userId: string,
  organizationId: string,
  targetUserId: string,
) {
  await assertOrgMember(userId, organizationId);

  const userRoles = await db.userRole.findMany({
    where: { userId: targetUserId, organizationId },
    include: {
      role: {
        select: { id: true, name: true },
      },
    },
  });

  // Import dynamically to avoid circular deps
  const { getUserPermissions } = await import("../rbac");
  const perms = await getUserPermissions(targetUserId, organizationId);

  return {
    userId: targetUserId,
    organizationId,
    roles: userRoles.map((ur: (typeof userRoles)[number]) => ur.role),
    permissions: [...perms].sort(),
  };
}
