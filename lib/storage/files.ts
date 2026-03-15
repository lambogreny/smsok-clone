import { randomBytes } from "node:crypto";

const STORED_FILE_PREFIX = "r2:";
const STORAGE_PROXY_PREFIX = "/api/storage";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

type StoredFileScope = "orders" | "payments" | "senders";
type StoredFileKind = "slips" | "wht" | "documents";

function inferExtension(fileName?: string | null, contentType?: string | null) {
  const extFromName = fileName?.split(".").pop()?.trim().toLowerCase();
  if (extFromName) {
    return extFromName.replace(/[^a-z0-9]+/g, "") || "bin";
  }

  if (contentType) {
    return MIME_EXTENSION_MAP[contentType] ?? "bin";
  }

  return "bin";
}

function buildTimestamp(now: Date) {
  return now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
}

export function buildStoredFileKey(input: {
  userId: string;
  scope: StoredFileScope;
  resourceId: string;
  kind: StoredFileKind;
  fileName?: string | null;
  contentType?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const ext = inferExtension(input.fileName, input.contentType);
  const nonce = randomBytes(6).toString("hex");

  return [
    "users",
    encodeURIComponent(input.userId),
    input.scope,
    encodeURIComponent(input.resourceId),
    input.kind,
    `${buildTimestamp(now)}-${nonce}.${ext}`,
  ].join("/");
}

export function toStoredFileRef(key: string) {
  return `${STORED_FILE_PREFIX}${key}`;
}

export function extractStoredFileKey(value: string | null | undefined) {
  if (!value?.startsWith(STORED_FILE_PREFIX)) {
    return null;
  }

  return value.slice(STORED_FILE_PREFIX.length);
}

export function isStoredFileRef(value: string | null | undefined) {
  return extractStoredFileKey(value) !== null;
}

export function buildStoredFileProxyUrl(keyOrRef: string) {
  const key = extractStoredFileKey(keyOrRef) ?? keyOrRef;
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${STORAGE_PROXY_PREFIX}/${encodedKey}`;
}

export function buildStoredFilePublicUrl(keyOrRef: string) {
  const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!publicBase) {
    return null;
  }

  const key = extractStoredFileKey(keyOrRef) ?? keyOrRef;
  const encodedKey = key
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${publicBase}/${encodedKey}`;
}

export function resolveStoredFileUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const storedKey = extractStoredFileKey(value);
  if (!storedKey) {
    return value;
  }

  return buildStoredFileProxyUrl(storedKey);
}

export function resolveStoredFilePublicUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const storedKey = extractStoredFileKey(value);
  if (!storedKey) {
    return value;
  }

  return buildStoredFilePublicUrl(storedKey) ?? buildStoredFileProxyUrl(storedKey);
}

export function getStoredFileOwnerId(keyOrRef: string | null | undefined) {
  const key = extractStoredFileKey(keyOrRef) ?? keyOrRef;
  if (!key) {
    return null;
  }

  const [scope, encodedUserId] = key.split("/");
  if (scope !== "users" || !encodedUserId) {
    return null;
  }

  try {
    return decodeURIComponent(encodedUserId);
  } catch {
    return null;
  }
}
