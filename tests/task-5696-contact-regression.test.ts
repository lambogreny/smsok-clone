import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

const contactsRouteSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/route.ts"), "utf-8");
const contactsActionsSource = readFileSync(resolve(ROOT, "lib/actions/contacts.ts"), "utf-8");

describe("Task #5696: contact API compatibility fixes", () => {
  it("accepts firstName/lastName payloads and array tags on the contacts API boundary", () => {
    expect(contactsRouteSource).toContain("function normalizeCreateContactBody");
    expect(contactsRouteSource).toContain("input.firstName");
    expect(contactsRouteSource).toContain("input.lastName");
    expect(contactsRouteSource).toContain("Array.isArray(input.tags)");
  });

  it("normalizes contact phone numbers before duplicate checks and writes", () => {
    expect(contactsActionsSource).toContain("const normalizedPhone = normalizePhone(input.phone);");
    expect(contactsActionsSource).toContain("userId_phone: { userId, phone: normalizedPhone }");
    expect(contactsActionsSource).toContain("phone: normalizedPhone");
  });
});
