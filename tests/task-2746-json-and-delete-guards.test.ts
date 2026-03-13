import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

const contactsRouteSource = readFileSync(resolve(ROOT, "app/api/v1/contacts/route.ts"), "utf-8");
const contactsActionsSource = readFileSync(resolve(ROOT, "lib/actions/contacts.ts"), "utf-8");
const deleteContactBlock = contactsActionsSource.slice(
  contactsActionsSource.indexOf("export async function deleteContact"),
  contactsActionsSource.indexOf("// ==========================================", contactsActionsSource.indexOf("export async function deleteContact")),
);

describe("Task #2746: JSON and delete guards", () => {
  it("rejects non-JSON and malformed JSON bodies before contact creation", () => {
    expect(contactsRouteSource).toContain('Content-Type must be application/json');
    expect(contactsRouteSource).toContain('throw new ApiError(400, "Invalid JSON")');
  });

  it("treats deleting unknown contacts as a 404 instead of a validation 400", () => {
    expect(deleteContactBlock).not.toContain("idSchema.parse({ id: contactId });");
    expect(deleteContactBlock).toContain('throw new ApiError(404, "ไม่พบผู้ติดต่อ")');
  });
});
