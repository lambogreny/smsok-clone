import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { processScheduledSms } from "@/lib/actions/scheduled-sms";

// POST /api/v1/sms/scheduled/process — cron endpoint to send due messages
// Protected by CRON_SECRET header (for external cron services like Vercel Cron)
export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const auth = req.headers.get("authorization");

    // Guard: empty string is falsy — block if not configured OR mismatch
    if (!cronSecret || !auth || auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await processScheduledSms();
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
