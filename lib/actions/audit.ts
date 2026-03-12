
import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma as db } from "../db";

// ── Audit Log Helper (append-only) ─────────────────────

type AuditLogParams = {
  organizationId?: string | null;
  userId?: string | null;
  action: string;       // "message.send", "contact.delete", "member.invite"
  resource: string;     // "Message", "Contact", "Organization"
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  result?: "success" | "failure";
};

export async function createAuditLog(params: AuditLogParams) {
  try {
    await db.auditLog.create({
      data: {
        organizationId: params.organizationId ?? undefined,
        userId: params.userId ?? undefined,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        result: params.result ?? "success",
      },
    });
  } catch {
    // Audit log failures should never break the main flow
    console.error("[audit] Failed to create audit log:", params.action);
  }
}

export async function getAuditLogs(
  orgId: string | null,
  options: {
    userId?: string;
    action?: string;
    resource?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { userId, action, resource, page = 1, limit = 50 } = options;

  const where: Record<string, unknown> = {};
  if (orgId) where.organizationId = orgId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Enhanced Search with Date Range ─────────────────────

type SearchAuditLogsOptions = {
  organizationId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string;   // ISO date string
  search?: string;   // search in action/resource/resourceId
  page?: number;
  limit?: number;
};

export async function searchAuditLogs(options: SearchAuditLogsOptions = {}) {
  const { organizationId, userId, action, resource, dateFrom, dateTo, search, page = 1, limit = 50 } = options;

  const where: Prisma.AuditLogWhereInput = {};

  if (organizationId) where.organizationId = organizationId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  // Free-text search across action, resource, resourceId
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
      { resourceId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Export Audit Logs ───────────────────────────────────

type ExportOptions = Omit<SearchAuditLogsOptions, "page" | "limit">;

export async function exportAuditLogs(
  options: ExportOptions,
  format: "csv" | "json"
) {
  const { organizationId, userId, action, resource, dateFrom, dateTo, search } = options;

  const where: Prisma.AuditLogWhereInput = {};

  if (organizationId) where.organizationId = organizationId;
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (resource) where.resource = resource;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
      { resourceId: { contains: search, mode: "insensitive" } },
    ];
  }

  const logs = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (format === "json") {
    return {
      data: JSON.stringify(logs, null, 2),
      contentType: "application/json",
      filename: `audit-logs-${timestamp}.json`,
    };
  }

  // CSV format
  const csvHeaders = "timestamp,userId,userName,action,resource,resourceId,result,ipAddress";
  const csvRows = logs.map((log) => {
    const userName = log.user?.name ?? "";
    return [
      log.createdAt.toISOString(),
      log.userId ?? "",
      `"${userName.replace(/"/g, '""')}"`,
      log.action,
      log.resource,
      log.resourceId ?? "",
      log.result,
      log.ipAddress ?? "",
    ].join(",");
  });

  return {
    data: [csvHeaders, ...csvRows].join("\n"),
    contentType: "text/csv",
    filename: `audit-logs-${timestamp}.csv`,
  };
}

// ── Retention Cleanup ───────────────────────────────────

export async function cleanupOldAuditLogs(retentionDays = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const result = await db.auditLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return { deleted: result.count };
}

// ── Middleware Helper ───────────────────────────────────

export async function auditMiddleware(
  req: NextRequest,
  userId: string | null,
  action: string,
  resource: string,
  resourceId?: string
) {
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    undefined;
  const userAgent = req.headers.get("user-agent") || undefined;

  // Fire-and-forget
  createAuditLog({
    userId,
    action,
    resource,
    resourceId,
    ipAddress,
    userAgent,
  }).catch(() => {});
}
