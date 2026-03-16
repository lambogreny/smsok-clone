import { apiResponse } from "@/lib/api-auth";
import { WEBHOOK_EVENT_REGISTRY } from "@/lib/actions/webhooks";

// GET /api/v1/webhooks/events — canonical event registry
export async function GET() {
  return apiResponse({ events: WEBHOOK_EVENT_REGISTRY });
}
