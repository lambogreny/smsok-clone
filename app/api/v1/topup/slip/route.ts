import { NextRequest } from "next/server";
import { authenticateApiKey, apiResponse, apiError } from "@/lib/api-auth";
import { uploadSlip } from "@/lib/actions/payments";

export async function POST(req: NextRequest) {
  try {
    await authenticateApiKey(req);
    const body = await req.json();

    const result = await uploadSlip(body.transactionId, body.slipUrl);
    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
