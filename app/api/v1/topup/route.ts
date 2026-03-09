import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { purchasePackage } from "@/lib/actions/payments";
import { purchasePackageSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();
    const input = purchasePackageSchema.parse(body);
    const result = await purchasePackage(
      user.id,
      input.packageId,
      input.method
    );

    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
