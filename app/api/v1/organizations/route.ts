import { NextRequest } from "next/server";
import { apiResponse, apiError, authenticateRequest } from "@/lib/api-auth";
import { createOrganization, getUserOrganizations } from "@/lib/actions/organizations";
import { applyRateLimit } from "@/lib/rate-limit";
import { createOrganizationSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const orgs = await getUserOrganizations(user.id);
    return apiResponse({ organizations: orgs });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest(req);
    const rl = await applyRateLimit(user.id, "api");
    if (rl.blocked) return rl.blocked;
    const body = await req.json();
    const input = createOrganizationSchema.parse(body);
    const org = await createOrganization(user.id, input);
    return apiResponse(org, 201);
  } catch (error) {
    return apiError(error);
  }
}
