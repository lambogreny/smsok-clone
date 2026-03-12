import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { getActivePolicies, createPolicy } from "@/lib/actions/consent";
import type { PolicyDocType } from "@prisma/client";

const VALID_POLICY_TYPES: PolicyDocType[] = ["PRIVACY", "TERMS", "MARKETING", "COOKIE"];

// GET /api/v1/consent/policies — list active policies
export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req);
    const policies = await getActivePolicies();
    return apiResponse({ policies });
  } catch (error) {
    return apiError(error);
  }
}

// POST /api/v1/consent/policies — create new policy version (admin)
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const { version, type, title, content, summary, requiresReconsent } = body as {
      version: string;
      type: PolicyDocType;
      title: string;
      content: string;
      summary?: string;
      requiresReconsent?: boolean;
    };

    if (!version || !type || !title || !content) {
      throw new ApiError(400, "กรุณาระบุ version, type, title, content");
    }
    if (!VALID_POLICY_TYPES.includes(type)) {
      throw new ApiError(400, `type ต้องเป็น: ${VALID_POLICY_TYPES.join(", ")}`);
    }

    const policy = await createPolicy(user.id, {
      version,
      type,
      title,
      content,
      summary,
      requiresReconsent,
    });

    return apiResponse({ policy }, 201);
  } catch (error) {
    return apiError(error);
  }
}
