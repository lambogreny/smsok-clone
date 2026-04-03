import type { UploadedFileLike } from "@/lib/uploaded-file";
import {
  buildStoredFileKey,
  extractStoredFileKey,
  toStoredFileRef,
} from "@/lib/storage/files";
import {
  deleteFileFromR2,
  downloadFileFromR2,
  getSignedDownloadUrlFromR2,
  uploadFileToR2,
} from "@/lib/storage/r2";

type StoredFileScope = "orders" | "payments" | "senders";
type StoredFileKind = "slips" | "wht" | "documents";

type StoreFileInput = {
  userId: string;
  scope: StoredFileScope;
  resourceId: string;
  kind: StoredFileKind;
  body: Buffer;
  contentType: string;
  fileName?: string | null;
};

export class StorageUploadError extends Error {
  constructor(
    message = "R2 upload failed",
    public readonly reason?: string,
  ) {
    super(message);
    this.name = "StorageUploadError";
  }
}

export async function storeBufferInR2(input: StoreFileInput) {
  const key = buildStoredFileKey({
    userId: input.userId,
    scope: input.scope,
    resourceId: input.resourceId,
    kind: input.kind,
    fileName: input.fileName,
    contentType: input.contentType,
  });

  try {
    await uploadFileToR2({
      key,
      body: input.body,
      contentType: input.contentType,
    });
  } catch (error) {
    const isConfigError = error instanceof Error && error.message === "R2 storage is not configured";
    const reason = isConfigError ? "not_configured" : "upload_failed";
    console.error(`[storage] R2 ${reason}:`, error);
    throw new StorageUploadError("R2 upload failed", reason);
  }

  return {
    key,
    ref: toStoredFileRef(key),
    storage: "r2" as const,
  };
}

export async function storeUploadedFile(input: {
  userId: string;
  scope: StoredFileScope;
  resourceId: string;
  kind: StoredFileKind;
  file: UploadedFileLike;
}) {
  const body = Buffer.from(await input.file.arrayBuffer());
  const contentType = input.file.type || "application/octet-stream";
  const stored = await storeBufferInR2({
    userId: input.userId,
    scope: input.scope,
    resourceId: input.resourceId,
    kind: input.kind,
    body,
    contentType,
    fileName: input.file.name,
  });

  return {
    ...stored,
    body,
    contentType,
  };
}

export async function resolveStoredFileVerificationUrl(value: string) {
  const key = extractStoredFileKey(value);
  if (!key) {
    return value;
  }

  return getSignedDownloadUrlFromR2(key, { expiresIn: 300 });
}

export async function readStoredFile(value: string) {
  const key = extractStoredFileKey(value) ?? value;
  if (!key) {
    throw new Error("Stored file key missing");
  }

  return downloadFileFromR2(key);
}

export async function removeStoredFile(value: string | null | undefined) {
  const key = extractStoredFileKey(value ?? "");
  if (!key) {
    return;
  }

  await deleteFileFromR2(key);
}
