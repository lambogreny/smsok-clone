import { NextRequest } from "next/server";
import { authenticateRequest, apiResponse, apiError, ApiError } from "@/lib/api-auth";
import { bumpPolicyVersion, createPolicy, getActivePolicies } from "@/lib/actions/consent";
import type { PolicyDocType } from "@prisma/client";
import { z } from "zod";

const VALID_POLICY_TYPES: PolicyDocType[] = ["PRIVACY", "TERMS", "MARKETING", "COOKIE"];
const policySchema = z.object({
  version: z.string().trim().min(1, "กรุณาระบุ version").optional(),
  type: z.enum(["PRIVACY", "TERMS", "MARKETING", "COOKIE"]),
  title: z.string().trim().min(1, "กรุณาระบุ title"),
  content: z.string().trim().min(1, "กรุณาระบุ content"),
  summary: z.string().trim().optional(),
  requiresReconsent: z.boolean().optional(),
});

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

    const input = policySchema.parse(body);
    const { version, type, title, content, summary, requiresReconsent } = input;

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

// PUT /api/v1/consent/policies — bump active policy version and require re-consent
export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError(400, "กรุณาส่งข้อมูล JSON");
    }

    const input = policySchema.omit({ requiresReconsent: true }).parse(body);

    if (!VALID_POLICY_TYPES.includes(input.type)) {
      throw new ApiError(400, `type ต้องเป็น: ${VALID_POLICY_TYPES.join(", ")}`);
    }

    const policy = await bumpPolicyVersion(user.id, input);

    return apiResponse({ policy, requiresReconsent: true });
  } catch (error) {
    return apiError(error);
  }
}
