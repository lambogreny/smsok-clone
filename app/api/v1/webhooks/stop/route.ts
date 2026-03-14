import { NextRequest } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { stopWebhookBodySchema } from "@/lib/validations";

function hashForCompare(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * POST /api/v1/webhooks/stop — handle STOP/opt-out webhook from SMS gateway
 *
 * When a recipient replies "STOP" to an SMS, the gateway calls this endpoint.
 * We set smsConsent = false for the matching contact.
 *
 * Body: { phone: string, keyword?: string }
 * Auth: Shared secret via X-Webhook-Secret header
 */

export async function POST(req: NextRequest) {
  // Verify webhook secret (hash both sides to fixed 32-byte length, preventing length oracle)
  const secret = req.headers.get("x-webhook-secret");
  const expectedSecret = process.env.STOP_WEBHOOK_SECRET;
  if (!expectedSecret || !secret || !timingSafeEqual(hashForCompare(secret), hashForCompare(expectedSecret))) {
    return Response.json({ error: "ไม่ได้รับอนุญาต" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = stopWebhookBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Missing phone" }, { status: 400 });
  }
  const { phone } = parsed.data;

  // Normalize phone (strip leading 0, add +66)
  const normalized = phone.startsWith("+") ? phone : phone.startsWith("0") ? `+66${phone.slice(1)}` : `+66${phone}`;

  // PDPA/TCPA compliance: STOP opt-out is GLOBAL across all orgs
  // A recipient who says STOP must be respected everywhere — not org-scoped
  const result = await prisma.contact.updateMany({
    where: { phone: normalized, consentStatus: { not: "OPTED_OUT" } },
    data: {
      smsConsent: false,
      consentStatus: "OPTED_OUT",
      optOutAt: new Date(),
      optOutReason: "STOP keyword",
    },
  });

  return Response.json({ success: true });
}

