// Shared type for contact server action errors.
// Must live outside "use server" files because sync functions are not allowed there.

export type ContactActionError = { __contactActionError: string; __field?: string };

export function isContactActionError(v: unknown): v is ContactActionError {
  return typeof v === "object" && v !== null && "__contactActionError" in v;
}
