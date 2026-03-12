export const API_KEY_PERMISSIONS = [
  "sms:send",
  "sms:read",
  "otp:send",
  "otp:verify",
  "contacts:read",
  "contacts:write",
  "campaigns:read",
  "campaigns:write",
  "templates:read",
  "templates:write",
  "groups:read",
  "groups:write",
  "webhooks:read",
  "webhooks:write",
  "billing:read",
] as const;

export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export type ApiKeyRoutePermission = ApiKeyPermission | "session-only" | null;

const API_KEY_PERMISSION_SET = new Set<string>(API_KEY_PERMISSIONS);

const LEGACY_API_KEY_PERMISSION_ALIASES: Record<string, ApiKeyPermission> = {
  send_sms: "sms:send",
  read_sms: "sms:read",
  "sms:write": "sms:send",
  send_otp: "otp:send",
  verify_otp: "otp:verify",
  read_contacts: "contacts:read",
  write_contacts: "contacts:write",
  manage_contacts: "contacts:write",
  "contact:read": "contacts:read",
  "contact:write": "contacts:write",
  read_campaigns: "campaigns:read",
  write_campaigns: "campaigns:write",
  manage_campaigns: "campaigns:write",
  "campaign:read": "campaigns:read",
  "campaign:write": "campaigns:write",
  read_templates: "templates:read",
  write_templates: "templates:write",
  manage_templates: "templates:write",
  "template:read": "templates:read",
  "template:write": "templates:write",
  read_groups: "groups:read",
  write_groups: "groups:write",
  manage_groups: "groups:write",
  "group:read": "groups:read",
  "group:write": "groups:write",
  read_webhooks: "webhooks:read",
  write_webhooks: "webhooks:write",
  manage_webhooks: "webhooks:write",
  "webhook:read": "webhooks:read",
  "webhook:write": "webhooks:write",
  read_billing: "billing:read",
  "invoice:read": "billing:read",
};

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isReadMethod(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

export function normalizeApiKeyPermission(permission: string): ApiKeyPermission | null {
  const trimmed = permission.trim();
  const normalized = LEGACY_API_KEY_PERMISSION_ALIASES[trimmed] ?? trimmed;
  if (!API_KEY_PERMISSION_SET.has(normalized)) {
    return null;
  }

  return normalized as ApiKeyPermission;
}

export function normalizeApiKeyPermissions(
  permissions: readonly string[] | null | undefined,
): ApiKeyPermission[] {
  const normalized = new Set<ApiKeyPermission>();

  for (const permission of permissions ?? []) {
    const resolved = normalizeApiKeyPermission(permission);
    if (resolved) {
      normalized.add(resolved);
    }
  }

  return [...normalized];
}

export function hasApiKeyPermission(
  permissions: readonly string[] | null | undefined,
  requiredPermission: ApiKeyPermission,
): boolean {
  return normalizeApiKeyPermissions(permissions).includes(requiredPermission);
}

export function resolveApiKeyRoutePermission(
  pathname: string,
  method: string,
): ApiKeyRoutePermission {
  const path = normalizePath(pathname);
  const verb = method.toUpperCase();
  const isRead = isReadMethod(verb);

  if (path === "/api/v1/api-keys" || path.startsWith("/api/v1/api-keys/")) {
    return "session-only";
  }

  if (path === "/api/v1/permissions") {
    return "session-only";
  }

  if (path === "/api/v1/organizations" || path.startsWith("/api/v1/organizations/")) {
    return "session-only";
  }

  if (path === "/api/v1/templates/render") {
    return "templates:read";
  }

  if (path === "/api/v1/templates" || path.startsWith("/api/v1/templates/")) {
    return isRead ? "templates:read" : "templates:write";
  }

  if (path === "/api/v1/webhooks" || path.startsWith("/api/v1/webhooks/")) {
    return isRead ? "webhooks:read" : "webhooks:write";
  }

  if (path === "/api/v1/campaigns" || path.startsWith("/api/v1/campaigns/")) {
    return isRead ? "campaigns:read" : "campaigns:write";
  }

  if (
    path === "/api/v1/groups" ||
    path.startsWith("/api/v1/groups/") ||
    path === "/api/v1/contacts/groups"
  ) {
    return isRead ? "groups:read" : "groups:write";
  }

  if (
    path === "/api/v1/custom-fields" ||
    path.startsWith("/api/v1/custom-fields/") ||
    path === "/api/v1/tags" ||
    path.startsWith("/api/v1/tags/") ||
    path === "/api/v1/contacts" ||
    path.startsWith("/api/v1/contacts/")
  ) {
    return isRead ? "contacts:read" : "contacts:write";
  }

  if (path === "/api/v1/senders" || path.startsWith("/api/v1/senders/")) {
    return isRead ? "sms:read" : "sms:send";
  }

  if (path === "/api/v1/otp/send") {
    return "otp:send";
  }

  if (path === "/api/v1/otp/verify") {
    return "otp:verify";
  }

  if (path === "/api/v1/sms/send" || path === "/api/v1/sms/batch") {
    return "sms:send";
  }

  if (path === "/api/v1/sms/scheduled") {
    return isRead ? "sms:read" : "sms:send";
  }

  if (
    path.startsWith("/api/v1/sms/") ||
    path === "/api/v1/messages" ||
    path.startsWith("/api/v1/messages/") ||
    path === "/api/v1/logs" ||
    path.startsWith("/api/v1/logs/") ||
    path === "/api/v1/analytics" ||
    path.startsWith("/api/v1/analytics/") ||
    path === "/api/v1/links" ||
    path.startsWith("/api/v1/links/")
  ) {
    return isRead ? "sms:read" : "sms:send";
  }

  if (
    path === "/api/v1/transactions" ||
    path.startsWith("/api/v1/transactions/") ||
    path === "/api/v1/invoices" ||
    path.startsWith("/api/v1/invoices/") ||
    path === "/api/v1/credits" ||
    path.startsWith("/api/v1/credits/") ||
    path === "/api/v1/balance" ||
    path.startsWith("/api/v1/balance/")
  ) {
    return isRead ? "billing:read" : null;
  }

  return null;
}

export function mapRbacPermissionToApiKeyPermission(
  action: string,
  resource: string,
): ApiKeyPermission | null {
  switch (`${action}:${resource}`) {
    case "create:sms":
      return "sms:send";
    case "read:sms":
    case "read:analytics":
      return "sms:read";
    case "create:otp":
      return "otp:send";
    case "verify:otp":
      return "otp:verify";
    case "read:contact":
      return "contacts:read";
    case "create:contact":
    case "update:contact":
    case "delete:contact":
      return "contacts:write";
    case "read:group":
      return "groups:read";
    case "create:group":
    case "update:group":
    case "delete:group":
      return "groups:write";
    case "read:campaign":
      return "campaigns:read";
    case "create:campaign":
    case "update:campaign":
    case "delete:campaign":
      return "campaigns:write";
    case "read:template":
      return "templates:read";
    case "create:template":
    case "update:template":
    case "delete:template":
      return "templates:write";
    case "read:webhook":
      return "webhooks:read";
    case "create:webhook":
    case "update:webhook":
    case "delete:webhook":
      return "webhooks:write";
    case "read:invoice":
      return "billing:read";
    default:
      return null;
  }
}
