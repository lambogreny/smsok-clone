// DEPRECATED: This endpoint is obsolete.
// Package purchases are now handled by /api/v1/packages/purchase/route.ts
// which uses the PackageTier model instead of the old Package + purchasePackage system.
// This file is kept as a placeholder to avoid 404s — returns 410 Gone.

import { apiError, ApiError } from "@/lib/api-auth";

export async function POST() {
  return apiError(
    new ApiError(410, "This endpoint is deprecated. Use POST /api/v1/packages/purchase instead.")
  );
}
