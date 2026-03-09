import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { purchasePackage } from "@/lib/actions/payments";

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateApiKey(req);
    const body = await req.json();

    const result = await purchasePackage(
      user.id,
      body.packageId,
      body.method || "bank_transfer"
    );

    return apiResponse(result, 201);
  } catch (error) {
    return apiError(error);
  }
}
