import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

const actionUser = readFileSync(resolve(ROOT, "lib/action-user.ts"), "utf-8");
const apiAuth = readFileSync(resolve(ROOT, "lib/api-auth.ts"), "utf-8");
const contactsPage = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/contacts/page.tsx"), "utf-8");
const groupsPage = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/groups/page.tsx"), "utf-8");
const groupDetailPage = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/groups/[id]/page.tsx"), "utf-8");
const contactDetailPage = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/contacts/[id]/page.tsx"), "utf-8");
const contactsClient = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/contacts/ContactsClient.tsx"), "utf-8");
const groupsClient = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/groups/GroupsPageClient.tsx"), "utf-8");
const groupDetailClient = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/groups/[id]/GroupDetailClient.tsx"), "utf-8");
const importWizard = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/contacts/ImportWizard.tsx"), "utf-8");
const contactDetailClient = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/contacts/[id]/ContactDetailClient.tsx"), "utf-8");
const consentSection = readFileSync(resolve(ROOT, "app/(dashboard)/dashboard/contacts/[id]/ConsentSection.tsx"), "utf-8");
const excelImportActions = readFileSync(resolve(ROOT, "lib/actions/excel-import.ts"), "utf-8");

describe("Task #2354: userId hardening across dashboard actions", () => {
  it("action-user resolves against session or trusted request context before any caller-supplied userId", () => {
    expect(actionUser).toContain("const requestUserId = await getTrustedRequestUserId();");
    expect(actionUser).toContain("const currentUserId = sessionUser?.id ?? trustedUserId ?? requestUserId;");
    expect(actionUser).toContain("if (!isInternalCall && currentUserId)");
    expect(actionUser).toContain("return currentUserId;");
  });

  it("authenticateRequest binds authenticated users into the action context", () => {
    expect(apiAuth).toContain('trustActionUserId(session.id, req.headers.get("x-request-id"));');
    expect(apiAuth).toContain('trustActionUserId(apiKey.user.id, req.headers.get("x-request-id"));');
  });

  it("dashboard pages stop passing user.id into client-facing server actions", () => {
    expect(contactsPage).toContain("getContacts({ page, limit })");
    expect(contactsPage).toContain("getContactGroups()");
    expect(groupsPage).toContain("getGroups()");
    expect(groupDetailPage).toContain("getGroupContacts(id)");
    expect(groupDetailPage).toContain("getContactsNotInGroup(id)");
    expect(contactDetailPage).toContain("getContactById(id)");
    expect(contactDetailPage).toContain("getCustomFields()");
    expect(contactsPage).not.toContain("userId={user.id}");
    expect(groupsPage).not.toContain("userId={user.id}");
    expect(groupDetailPage).not.toContain("userId={user.id}");
    expect(contactDetailPage).not.toContain("userId={user.id}");
  });

  it("contact and group clients no longer forward userId into server actions", () => {
    expect(contactsClient).not.toContain("updateContact(userId,");
    expect(contactsClient).not.toContain("createContact(userId,");
    expect(contactsClient).not.toContain("bulkUpdateTags(userId,");
    expect(contactsClient).not.toContain("userId={userId}");
    expect(contactsClient).toContain("updateContact(editingContact.id,");
    expect(contactsClient).toContain("createContact({");
    expect(groupsClient).not.toContain("searchContactsBasic(userId,");
    expect(groupsClient).not.toContain("updateGroup(userId,");
    expect(groupsClient).not.toContain("deleteGroup(userId,");
    expect(groupDetailClient).not.toContain("getContactsNotInGroup(userId,");
    expect(groupDetailClient).not.toContain("bulkRemoveFromGroup(userId,");
    expect(groupDetailClient).not.toContain("importContacts(userId,");
  });

  it("detail and import flows derive identity on the server", () => {
    expect(contactDetailClient).not.toContain("userId={userId}");
    expect(consentSection).toContain("updateContactConsent(contactId,");
    expect(importWizard).not.toContain("userId,");
    expect(importWizard).toContain("importContactsFromExcel(");
    expect(excelImportActions).toContain("buffer: ArrayBuffer,");
    expect(excelImportActions).toContain("const userId = await resolveActionUserId(hasExplicitUserId ? userIdOrBuffer : undefined);");
  });
});
