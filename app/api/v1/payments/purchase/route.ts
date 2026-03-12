// DEPRECATED: Redirects to new payment flow at /api/payments
import { NextRequest } from "next/server";
import { apiError, ApiError } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  return apiError(
    new ApiError(410, "Endpoint deprecated. Use POST /api/payments instead.", "DEPRECATED")
  );
}

export async function GET() {
  return apiError(
    new ApiError(410, "Endpoint deprecated. Use GET /api/payments instead.", "DEPRECATED")
  );
}
