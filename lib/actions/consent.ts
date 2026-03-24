import { prisma as db } from "../db";
type ConsentType = "SERVICE" | "MARKETING" | "THIRD_PARTY" | "COOKIE";
type ConsentAction = "OPT_IN" | "OPT_OUT";
type PolicyDocType = "PRIVACY" | "TERMS" | "MARKETING" | "COOKIE";

const CONSENT_TO_POLICY_TYPE: Record<ConsentType, PolicyDocType> = {
  SERVICE: "TERMS",
  MARKETING: "MARKETING",
  THIRD_PARTY: "PRIVACY",
  COOKIE: "COOKIE",
};

function getNextPolicyVersion(currentVersion?: string | null) {
  if (!currentVersion) return "1.0";

  const [major, minor = "0"] = currentVersion.split(".");
  const majorNumber = Number(major);
  const minorNumber = Number(minor);

  if (Number.isNaN(majorNumber) || Number.isNaN(minorNumber)) {
    return currentVersion;
  }

  return `${majorNumber}.${minorNumber + 1}`;
}

// ── Log Consent (append-only) + update materialized status ──

export async function logConsent(opts: {
  userId: string;
  policyId: string;
  consentType: ConsentType;
  action: ConsentAction;
  ipAddress?: string;
  userAgent?: string;
  channel?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const policy = await db.pdpaPolicy.findUnique({
    where: { id: opts.policyId },
    select: { version: true },
  });

  const [log] = await db.$transaction([
    db.pdpaConsentLog.create({
      data: {
        userId: opts.userId,
        policyId: opts.policyId,
        consentType: opts.consentType,
        action: opts.action,
        ipAddress: opts.ipAddress,
        userAgent: opts.userAgent,
        channel: opts.channel ?? "WEB",
        metadata: opts.metadata ?? undefined,
      },
    }),
    // Upsert materialized ConsentStatus for fast lookups
    db.consentStatus.upsert({
      where: {
        userId_consentType: {
          userId: opts.userId,
          consentType: opts.consentType,
        },
      },
      update: {
        isConsented: opts.action === "OPT_IN",
        policyVersion: policy?.version ?? "1.0",
      },
      create: {
        userId: opts.userId,
        consentType: opts.consentType,
        isConsented: opts.action === "OPT_IN",
        policyVersion: policy?.version ?? "1.0",
      },
    }),
  ]);

  return log;
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
    select: { id: true, type: true, version: true },
  });

  const policyMap = new Map<string, { id: string; version: string }>(policies.map((p: (typeof policies)[number]) => [p.type as string, { id: p.id, version: p.version }] as [string, { id: string; version: string }]));

  let logged = 0;
  for (const c of opts.consents) {
    const policyType = CONSENT_TO_POLICY_TYPE[c.consentType];
    const policy = policyMap.get(policyType);
    if (!policy) continue;

    await logConsent({
      userId: opts.userId,
      policyId: policy.id,
      consentType: c.consentType,
      action: c.action,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      channel: "WEB",
    });
    logged++;
  }

  return { logged };
}

// ── Get current consent status ──────────────────────────

export async function getUserConsentStatus(userId: string) {
  const consentTypes: ConsentType[] = ["SERVICE", "MARKETING", "THIRD_PARTY", "COOKIE"];

  const results = await Promise.all(
    consentTypes.map(async (type: ConsentType) => {
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
  const policyType = CONSENT_TO_POLICY_TYPE[opts.consentType];
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

export async function bumpPolicyVersion(adminId: string, data: {
  type: PolicyDocType;
  title: string;
  content: string;
  summary?: string;
  version?: string;
}) {
  const currentPolicy = await db.pdpaPolicy.findFirst({
    where: { type: data.type, isActive: true },
    select: { version: true },
    orderBy: { createdAt: "desc" },
  });

  return createPolicy(adminId, {
    version: data.version?.trim() || getNextPolicyVersion(currentPolicy?.version),
    type: data.type,
    title: data.title,
    content: data.content,
    summary: data.summary,
    requiresReconsent: true,
  });
}

// ── SMS Marketing Consent Guard ─────────────────────────

export async function hasMarketingConsent(userId: string): Promise<boolean> {
  const status = await db.consentStatus.findUnique({
    where: { userId_consentType: { userId, consentType: "MARKETING" } },
    select: { isConsented: true },
  });
  return status?.isConsented ?? false;
}

export async function assertMarketingConsent(userId: string): Promise<void> {
  const consented = await hasMarketingConsent(userId);
  if (!consented) {
    throw new Error("ผู้ใช้ไม่ได้ให้ความยินยอมรับ SMS การตลาด (PDPA)");
  }
}

// ── SMS Reply Opt-out ("0") ─────────────────────────────

export async function processSmsReplyOptOut(opts: {
  phone: string;
  ipAddress?: string;
}): Promise<{ processed: boolean; userIds: string[] }> {
  // Find contacts by phone — the recipient who opted out may belong to multiple users/orgs
  const contacts = await db.contact.findMany({
    where: { phone: opts.phone },
    select: { userId: true },
  });
  if (contacts.length === 0) return { processed: false, userIds: [] };

  // Find active MARKETING policy
  const policy = await db.pdpaPolicy.findFirst({
    where: { type: "MARKETING", isActive: true },
    select: { id: true },
  });
  if (!policy) return { processed: false, userIds: [] };

  // Log opt-out for each contact owner (the user who sent SMS to this phone)
  const uniqueUserIds: string[] = Array.from(new Set(contacts.map((c: (typeof contacts)[number]) => c.userId)));
  for (const userId of uniqueUserIds) {
    await logConsent({
      userId,
      policyId: policy.id,
      consentType: "MARKETING",
      action: "OPT_OUT",
      ipAddress: opts.ipAddress,
      channel: "SMS",
      metadata: { reason: "sms_reply_stop", phone: opts.phone },
    });
  }

  return { processed: true, userIds: uniqueUserIds };
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
