import { NextRequest } from "next/server";
import { ApiError, apiError, apiResponse } from "@/lib/api-auth";
import { createAuditLog } from "@/lib/actions/audit";
import {
  listSelfServiceDataRequests,
  submitSelfServiceDataRequest,
} from "@/lib/actions/pdpa";
import { getSession } from "@/lib/auth";
import { hasValidCsrfOrigin } from "@/lib/csrf";
import { getClientIp } from "@/lib/session-utils";

async function requireSession(req: NextRequest) {
  const session = await getSession({ headers: req.headers });
  if (!session?.id) {
    throw new ApiError(401, "กรุณาเข้าสู่ระบบ", "AUTH_MISSING");
  }

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS" && !hasValidCsrfOrigin(req)) {
    throw new ApiError(403, "CSRF: invalid origin", "FORBIDDEN");
  }

  return session;
}

async function createDeleteRequest(req: NextRequest) {
  const user = await requireSession(req);
  const result = await submitSelfServiceDataRequest(user.id, user.organizationId, "DELETE");

  await createAuditLog({
    organizationId: user.organizationId,
    userId: user.id,
    action: "pdpa.me.delete.request",
    resource: "DataRequest",
    resourceId: result.request.id,
    metadata: {
      requestType: result.request.type,
      duplicate: !result.created,
      selfService: true,
    },
    ipAddress: getClientIp(req.headers),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  return apiResponse(
    {
      request: result.request,
      created: result.created,
    },
    result.created ? 202 : 200,
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireSession(req);
    const requests = await listSelfServiceDataRequests(user.id, user.organizationId, ["DELETE"]);
    return apiResponse({ requests });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await createDeleteRequest(req);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    return await createDeleteRequest(req);
  } catch (error) {
    return apiError(error);
  }
}
