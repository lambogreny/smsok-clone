import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getSenderNames, requestSenderName } from "@/lib/actions/sender-names";
import { getRemainingQuota } from "@/lib/package/quota";

// GET /api/v1/senders — list all senders (with search/filter)
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const status = req.nextUrl.searchParams.get("status") || undefined;

    let senders = await getSenderNames(user.id);

    if (search) {
      const q = search.toLowerCase();
      senders = senders.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (status) {
      senders = senders.filter((s) => s.status === status);
    }

    // Include quota info for frontend
    const quotaInfo = await getRemainingQuota(user.id);
    const used = senders.filter((s) => s.status === "APPROVED" || s.status === "PENDING").length;
    const activePkg = quotaInfo.packages[0];

    return apiResponse({
      senders,
      quota: {
        used,
        limit: quotaInfo.senderNameLimit,
        packageName: activePkg?.tier?.name ?? null,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/senders — create sender (name, max 11 chars)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const sender = await requestSenderName(user.id, body);
    return apiResponse({ sender }, 201);
  } catch (error) {
    return apiError(error);
  }
}
