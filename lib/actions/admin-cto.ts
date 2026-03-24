
import { prisma as db } from "../db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Prisma: any = { JsonNull: null };
import { z } from "zod";

// ── Schemas ────────────────────────────────────────────

const createAlertSchema = z.object({
  type: z.string().min(1).max(100),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  message: z.string().min(1).max(500),
  rule: z.record(z.string(), z.string()).optional(),
});

const updateAlertSchema = z.object({
  isActive: z.boolean().optional(),
  resolvedAt: z.string().datetime().optional(),
  resolvedBy: z.string().optional(),
  resolveNote: z.string().max(500).optional(),
});

// ── 1. getCTOMetrics — System health overview ─────────

export async function getCTOMetrics() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalMessagesToday,
    failedMessagesToday,
    activeConnections,
    queueDepth,
    activeAlerts,
    providers,
  ] = await Promise.all([
    // Total messages today
    db.message.count({
      where: { createdAt: { gte: todayStart } },
    }),
    // Failed messages today
    db.message.count({
      where: { status: "failed", createdAt: { gte: todayStart } },
    }),
    // Active API keys (non-revoked)
    db.apiKey.count({
      where: { isActive: true },
    }),
    // Queue depth: pending or queued messages
    db.message.count({
      where: { status: { in: ["pending", "queued"] } },
    }),
    // Active alerts count
    db.alert.count({
      where: { isActive: true },
    }),
    // Provider statuses
    db.smsProvider.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        status: true,
        balance: true,
        dailySent: true,
        dailyLimit: true,
      },
    }),
  ]);

  const apiErrorRate =
    totalMessagesToday > 0
      ? Number(((failedMessagesToday / totalMessagesToday) * 100).toFixed(2))
      : 0;

  return {
    apiErrorRate,
    totalMessagesToday,
    failedMessagesToday,
    activeConnections,
    queueDepth,
    activeAlerts,
    providers: providers.map((p: (typeof providers)[number]) => ({
      id: p.id,
      name: p.name,
      displayName: p.displayName,
      status: p.status,
      balance: p.balance ? Number(p.balance) : null,
      dailySent: p.dailySent,
      dailyLimit: p.dailyLimit,
    })),
  };
}

// ── 2. getRecentErrors — Failed messages with details ─

export async function getRecentErrors(page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [errors, total] = await Promise.all([
    db.message.findMany({
      where: { status: "failed" },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        recipient: true,
        content: true,
        status: true,
        errorCode: true,
        createdAt: true,
        senderName: true,
        user: { select: { id: true, email: true } },
      },
    }),
    db.message.count({ where: { status: "failed" } }),
  ]);

  return {
    data: errors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── 3. getSlowEndpoints — Placeholder (not tracked) ──

export async function getSlowEndpoints(): Promise<
  Array<{ endpoint: string; avgMs: number; p99Ms: number; count: number }>
> {
  // Endpoint latency is not tracked in the database.
  // This placeholder returns an empty array for future implementation.
  return [];
}

// ── 4. getActiveApiKeys — API keys with usage stats ──

export async function getActiveApiKeys(page = 1, limit = 50) {
  const skip = (page - 1) * limit;

  const [apiKeys, total] = await Promise.all([
    db.apiKey.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
        user: { select: { id: true, email: true } },
        _count: { select: { apiLogs: true } },
      },
    }),
    db.apiKey.count({ where: { isActive: true } }),
  ]);

  return {
    data: apiKeys.map((k: (typeof apiKeys)[number]) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      isActive: k.isActive,
      lastUsed: k.lastUsed,
      createdAt: k.createdAt,
      userEmail: k.user.email,
      userId: k.user.id,
      totalRequests: k._count.apiLogs,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── 5. getDeployments — Deployment history ────────────

export async function getDeployments(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [deployments, total] = await Promise.all([
    db.deployment.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.deployment.count(),
  ]);

  return {
    data: deployments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── 6. getAlerts — Alert rules + active alerts ────────

export async function getAlerts(options: {
  active?: boolean;
  severity?: string;
} = {}) {
  const where: Record<string, unknown> = {};

  if (options.active !== undefined) {
    where.isActive = options.active;
  }

  if (options.severity) {
    where.severity = options.severity;
  }

  return db.alert.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

// ── 7. createAlert — Create alert rule ────────────────

export async function createAlert(data: unknown) {
  const parsed = createAlertSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  return db.alert.create({
    data: {
      type: parsed.data.type,
      severity: parsed.data.severity,
      message: parsed.data.message,
      rule: parsed.data.rule ?? Prisma.JsonNull,
      isActive: true,
    },
  });
}

// ── 8. updateAlert — Update/resolve alert ─────────────

export async function updateAlert(alertId: string, data: unknown) {
  const parsed = updateAlertSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง");
  }

  const existing = await db.alert.findUnique({ where: { id: alertId } });
  if (!existing) {
    throw new Error("ไม่พบ Alert นี้");
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.resolvedAt) updateData.resolvedAt = new Date(parsed.data.resolvedAt);
  if (parsed.data.resolvedBy) updateData.resolvedBy = parsed.data.resolvedBy;
  if (parsed.data.resolveNote) updateData.resolveNote = parsed.data.resolveNote;

  return db.alert.update({
    where: { id: alertId },
    data: updateData,
  });
}

// ── 9. toggleMaintenance — Toggle maintenance mode ────

export async function toggleMaintenance(adminId: string, enable: boolean) {
  if (enable) {
    // Create or reactivate MAINTENANCE alert
    const existing = await db.alert.findFirst({
      where: { type: "MAINTENANCE", isActive: true },
    });

    if (existing) {
      return existing; // Already in maintenance mode
    }

    return db.alert.create({
      data: {
        type: "MAINTENANCE",
        severity: "CRITICAL",
        message: "ระบบอยู่ในโหมดซ่อมบำรุง (Maintenance Mode)",
        isActive: true,
        triggeredAt: new Date(),
      },
    });
  } else {
    // Resolve all active MAINTENANCE alerts
    const result = await db.alert.updateMany({
      where: { type: "MAINTENANCE", isActive: true },
      data: {
        isActive: false,
        resolvedAt: new Date(),
        resolvedBy: adminId,
        resolveNote: "Maintenance mode disabled",
      },
    });

    return { resolved: result.count };
  }
}

// ── 10. getSystemHealth — All providers status ────────

export async function getSystemHealth() {
  const providers = await db.smsProvider.findMany({
    select: {
      name: true,
      displayName: true,
      status: true,
      balance: true,
      dailySent: true,
      dailyLimit: true,
    },
  });

  return providers.map((p: (typeof providers)[number]) => ({
    name: p.displayName || p.name,
    status: p.status,
    balance: p.balance ? Number(p.balance) : null,
    dailySent: p.dailySent,
    dailyLimit: p.dailyLimit,
  }));
}
