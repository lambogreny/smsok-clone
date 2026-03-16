import { NextRequest } from "next/server";
import { apiError, apiResponse } from "@/lib/api-auth";
import { authenticateRequest } from "@/lib/api-auth";
import { requireApiPermission } from "@/lib/rbac";
import { createCampaign, getCampaigns } from "@/lib/actions/campaigns";
import { createCampaignSchema } from "@/lib/validations";
import { readJsonOr400 } from "@/lib/read-json-or-400";

function normalizeCampaignPayload(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const input = body as Record<string, unknown>;
  return {
    ...input,
    contactGroupId: input.contactGroupId ?? input.contact_group_id,
    templateId: input.templateId ?? input.template_id,
    messageBody: input.messageBody ?? input.message_body,
    senderName: input.senderName ?? input.sender_name,
    scheduledAt: input.scheduledAt ?? input.scheduled_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "read", "campaign");
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "20";
    const status = searchParams.get("status") || undefined;

    const result = await getCampaigns(user.id, { page, limit, status });
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    const denied = await requireApiPermission(user.id, "create", "campaign");
    if (denied) return denied;
    const body = normalizeCampaignPayload(await readJsonOr400(req));
    const input = createCampaignSchema.parse(body);
    const campaign = await createCampaign(user.id, input);
    return apiResponse(campaign, 201);
  } catch (error) {
    return apiError(error);
  }
}
