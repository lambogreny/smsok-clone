import { NextRequest } from "next/server";
import { ApiError, authenticateApiKey } from "./api-auth";
import { ApiKeyPermission, hasApiKeyPermission } from "./api-key-permissions";
import { ERROR_CODES } from "./api-log";

const PUBLIC_API_KEY_ROUTE_PATTERNS = [
  /^\/api\/v1\/permissions$/,
  /^\/api\/v1\/links$/,
  /^\/api\/v1\/links\/[^/]+\/stats$/,
  /^\/api\/v1\/pdpa\/consent$/,
  /^\/api\/v1\/pdpa\/opt-out$/,
  /^\/api\/v1\/pdpa\/data-requests$/,
  /^\/api\/v1\/pdpa\/data-requests\/[^/]+$/,
];

export function extractPublicApiKey(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  const headerApiKey = req.headers.get("x-api-key")?.trim();
  return headerApiKey || null;
}

function isAllowedPublicApiKeyRoute(pathname: string) {
  return PUBLIC_API_KEY_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export async function authenticatePublicApiKey(req: NextRequest) {
  if (!isAllowedPublicApiKeyRoute(req.nextUrl.pathname)) {
    throw new ApiError(
      403,
      "Public API key auth is only allowed on explicitly supported routes",
      ERROR_CODES.FORBIDDEN,
    );
  }

  return authenticateApiKey(req);
}

export function checkApiKeyPermission(
  grantedPermissions: readonly string[] | null | undefined,
  requiredPermission: ApiKeyPermission,
) {
  if (!hasApiKeyPermission(grantedPermissions, requiredPermission)) {
    throw new ApiError(403, "API Key ไม่มีสิทธิ์เข้าถึง", ERROR_CODES.FORBIDDEN);
  }
}

export async function requireAdminPublicApiKey(req: NextRequest) {
  const user = await authenticatePublicApiKey(req);
  if (user.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }
  return user;
}
