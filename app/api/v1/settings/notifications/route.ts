import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError } from "@/lib/api-auth";
import { prisma as db } from "@/lib/db";

// ── Field mapping ──────────────────────────────────────────────────────────
// Frontend uses { id, email, sms } format; DB uses field names like emailCreditLow

type DbFields = {
  emailCreditLow?:     boolean;
  emailCampaignDone?:  boolean;
  emailWeeklyReport?:  boolean;
  emailSecurity?:      boolean;
  emailPackageExpiry?: boolean;
  emailInvoice?:       boolean;
  emailApiError?:      boolean;
  smsCreditLow?:       boolean;
  smsCampaignDone?:    boolean;
  smsWeeklyReport?:    boolean;
  smsSecurityAlert?:   boolean;
  smsPackageExpiry?:   boolean;
  smsInvoice?:         boolean;
  smsApiError?:        boolean;
};

const DB_DEFAULTS: Required<DbFields> = {
  emailCreditLow:     true,
  emailCampaignDone:  true,
  emailWeeklyReport:  false,
  emailSecurity:      true,
  emailPackageExpiry: true,
  emailInvoice:       true,
  emailApiError:      true,
  smsCreditLow:       false,
  smsCampaignDone:    false,
  smsWeeklyReport:    false,
  smsSecurityAlert:   false,
  smsPackageExpiry:   false,
  smsInvoice:         false,
  smsApiError:        false,
};

const CHANNEL_MAP: Record<string, { email?: keyof DbFields; sms?: keyof DbFields }> = {
  low_balance:       { email: "emailCreditLow",     sms: "smsCreditLow" },
  campaign_complete: { email: "emailCampaignDone",  sms: "smsCampaignDone" },
  monthly_report:    { email: "emailWeeklyReport",  sms: "smsWeeklyReport" },
  security_alert:    { email: "emailSecurity",      sms: "smsSecurityAlert" },
  package_expiry:    { email: "emailPackageExpiry", sms: "smsPackageExpiry" },
  invoice:           { email: "emailInvoice",       sms: "smsInvoice" },
  api_error:         { email: "emailApiError",      sms: "smsApiError" },
};

function toFrontendArray(prefs: Required<DbFields>) {
  return Object.entries(CHANNEL_MAP).map(([id, channels]) => ({
    id,
    ...(channels.email !== undefined ? { email: prefs[channels.email] ?? DB_DEFAULTS[channels.email] } : {}),
    ...(channels.sms   !== undefined ? { sms:   prefs[channels.sms]   ?? DB_DEFAULTS[channels.sms]   } : {}),
  }));
}

function toDbPatch(body: { id: string; email?: boolean; sms?: boolean }): DbFields {
  const channels = CHANNEL_MAP[body.id];
  if (!channels) return {};
  const patch: DbFields = {};
  if (channels.email !== undefined && body.email !== undefined) patch[channels.email] = body.email;
  if (channels.sms   !== undefined && body.sms   !== undefined) patch[channels.sms]   = body.sms;
  return patch;
}

async function getDbPrefs(userId: string): Promise<Required<DbFields>> {
  const row = await db.notificationPrefs.findUnique({
    where: { userId },
    select: {
      emailCreditLow:     true,
      emailCampaignDone:  true,
      emailWeeklyReport:  true,
      emailSecurity:      true,
      emailPackageExpiry: true,
      emailInvoice:       true,
      emailApiError:      true,
      smsCreditLow:       true,
      smsCampaignDone:    true,
      smsWeeklyReport:    true,
      smsSecurityAlert:   true,
      smsPackageExpiry:   true,
      smsInvoice:         true,
      smsApiError:        true,
    },
  });
  return { ...DB_DEFAULTS, ...(row ?? {}) };
}

// GET /api/v1/settings/notifications
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const prefs = await getDbPrefs(user.id);
    return apiResponse(toFrontendArray(prefs));
  } catch (error) {
    return apiError(error);
  }
}

// PATCH /api/v1/settings/notifications — { id, email?, sms? }
export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const body = await req.json() as { id: string; email?: boolean; sms?: boolean };
    const patch = toDbPatch(body);

    if (Object.keys(patch).length === 0) {
      const prefs = await getDbPrefs(user.id);
      return apiResponse(toFrontendArray(prefs));
    }

    await db.notificationPrefs.upsert({
      where:  { userId: user.id },
      create: { userId: user.id, ...DB_DEFAULTS, ...patch },
      update: patch,
    });

    const prefs = await getDbPrefs(user.id);
    return apiResponse(toFrontendArray(prefs));
  } catch (error) {
    return apiError(error);
  }
}

// PUT — alias for full update (same as PATCH for now)
export { PATCH as PUT };
