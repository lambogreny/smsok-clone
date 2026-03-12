import { prisma as db } from "../db";
import type { ConsentType, ConsentAction, PolicyDocType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// ── Log Consent (append-only) ───────────────────────────

export async function logConsent(opts: {
  userId: string;
  policyId: string;
  consentType: ConsentType;
  action: ConsentAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  return db.pdpaConsentLog.create({
    data: {
      userId: opts.userId,
      policyId: opts.policyId,
      consentType: opts.consentType,
      action: opts.action,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      metadata: opts.metadata as Prisma.InputJsonValue ?? undefined,
    },
  });
}

// ── Log multiple consents at registration ───────────────

export async function logRegistrationConsent(opts: {
  userId: string;
  consents: Array<{
    consentType: ConsentType;
    action: ConsentAction;
  }>;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Get active policies for each consent type
  const policies = await db.pdpaPolicy.findMany({
    where: { isActive: true },
    select: { id: true, type: true },
  });

  const policyMap = new Map(policies.map((p) => [p.type as string, p.id]));

  // Map consent types to policy doc types
  const consentToPolicyType: Record<string, PolicyDocType> = {
    SERVICE: "TERMS",
    MARKETING: "MARKETING",
    THIRD_PARTY: "PRIVACY",
    COOKIE: "COOKIE",
  };

  const logs = opts.consents
    .map((c) => {
      const policyType = consentToPolicyType[c.consentType];
      const policyId = policyMap.get(policyType);
      if (!policyId) return null;
      return {
        userId: opts.userId,
        policyId,
        consentType: c.consentType,
        action: c.action,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (logs.length > 0) {
    await db.pdpaConsentLog.createMany({ data: logs });
  }

  return { logged: logs.length };
}

// ── Get current consent status ──────────────────────────

export async function getUserConsentStatus(userId: string) {
  const consentTypes: ConsentType[] = ["SERVICE", "MARKETING", "THIRD_PARTY", "COOKIE"];

  const results = await Promise.all(
    consentTypes.map(async (type) => {
      const latest = await db.pdpaConsentLog.findFirst({
        where: { userId, consentType: type },
        orderBy: { recordedAt: "desc" },
        select: {
          action: true,
          recordedAt: true,
          policy: { select: { version: true, type: true } },
        },
      });
      return {
        type,
        status: latest?.action ?? null,
        acceptedAt: latest?.recordedAt ?? null,
        policyVersion: latest?.policy?.version ?? null,
      };
    })
  );

  return results;
}

// ── Withdraw consent ────────────────────────────────────

export async function withdrawConsent(opts: {
  userId: string;
  consentType: ConsentType;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Service and Third-party cannot be withdrawn without account closure
  if (opts.consentType === "SERVICE") {
    throw new Error("ไม่สามารถถอนความยินยอม Service ได้ — ต้องปิดบัญชี");
  }
  if (opts.consentType === "THIRD_PARTY") {
    throw new Error("ไม่สามารถถอนความยินยอม Third-party ได้ — จะไม่สามารถส่ง SMS ได้");
  }

  // Find the active policy for this consent type
  const policyType: PolicyDocType = opts.consentType === "MARKETING" ? "MARKETING" : "COOKIE";
  const policy = await db.pdpaPolicy.findFirst({
    where: { type: policyType, isActive: true },
    select: { id: true },
  });

  if (!policy) throw new Error("ไม่พบ policy ที่ active");

  return logConsent({
    userId: opts.userId,
    policyId: policy.id,
    consentType: opts.consentType,
    action: "OPT_OUT",
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    metadata: { reason: "user_requested" },
  });
}

// ── Get consent logs (admin) ────────────────────────────

export async function getConsentLogs(opts: {
  userId?: string;
  consentType?: ConsentType;
  action?: ConsentAction;
  page?: number;
  limit?: number;
}) {
  const page = opts.page ?? 1;
  const limit = Math.min(opts.limit ?? 50, 100);
  const skip = (page - 1) * limit;

  const where = {
    ...(opts.userId && { userId: opts.userId }),
    ...(opts.consentType && { consentType: opts.consentType }),
    ...(opts.action && { action: opts.action }),
  };

  const [logs, total] = await Promise.all([
    db.pdpaConsentLog.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        policy: { select: { version: true, type: true, title: true } },
      },
      orderBy: { recordedAt: "desc" },
      skip,
      take: limit,
    }),
    db.pdpaConsentLog.count({ where }),
  ]);

  return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ── Check if re-consent needed ──────────────────────────

export async function checkReconsentNeeded(userId: string): Promise<boolean> {
  // Find policies that require re-consent
  const policies = await db.pdpaPolicy.findMany({
    where: { isActive: true, requiresReconsent: true },
    select: { id: true, type: true, version: true },
  });

  for (const policy of policies) {
    const latestConsent = await db.pdpaConsentLog.findFirst({
      where: { userId, policyId: policy.id, action: "OPT_IN" },
      orderBy: { recordedAt: "desc" },
    });

    if (!latestConsent) return true; // Never consented to this version
  }

  return false;
}

// ── Policy CRUD (admin) ─────────────────────────────────

export async function createPolicy(adminId: string, data: {
  version: string;
  type: PolicyDocType;
  title: string;
  content: string;
  summary?: string;
  requiresReconsent?: boolean;
}) {
  // Deactivate previous version of same type
  await db.pdpaPolicy.updateMany({
    where: { type: data.type, isActive: true },
    data: { isActive: false },
  });

  return db.pdpaPolicy.create({
    data: {
      version: data.version,
      type: data.type,
      title: data.title,
      content: data.content,
      summary: data.summary,
      requiresReconsent: data.requiresReconsent ?? false,
      isActive: true,
      createdBy: adminId,
    },
  });
}

export async function getActivePolicies() {
  return db.pdpaPolicy.findMany({
    where: { isActive: true },
    select: {
      id: true,
      version: true,
      type: true,
      title: true,
      summary: true,
      requiresReconsent: true,
      createdAt: true,
    },
    orderBy: { type: "asc" },
  });
}
