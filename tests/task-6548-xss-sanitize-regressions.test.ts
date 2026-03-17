import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

describe("Task #6548: sanitize stored text inputs before persistence", () => {
  it("reuses shared contact-name validation in import endpoints", () => {
    const contactsImportSource = readFileSync(
      resolve(ROOT, "app/api/v1/contacts/import/route.ts"),
      "utf8",
    );
    const groupsImportSource = readFileSync(
      resolve(ROOT, "app/api/v1/groups/[id]/import/route.ts"),
      "utf8",
    );

    expect(contactsImportSource).toContain("createContactSchema.shape.name");
    expect(contactsImportSource).toContain("importedContactNameSchema.safeParse");
    expect(groupsImportSource).toContain("createContactSchema.shape.name");
    expect(groupsImportSource).toContain("importedContactNameSchema.safeParse");
  });

  it("uses shared sanitized text validation for ticket subjects, descriptions, and replies", () => {
    const ticketRouteSource = readFileSync(
      resolve(ROOT, "app/api/v1/tickets/route.ts"),
      "utf8",
    );
    const ticketReplySource = readFileSync(
      resolve(ROOT, "app/api/v1/tickets/[id]/reply/route.ts"),
      "utf8",
    );
    const adminSupportActionsSource = readFileSync(
      resolve(ROOT, "lib/actions/admin-support.ts"),
      "utf8",
    );
    const validationsSource = readFileSync(
      resolve(ROOT, "lib/validations.ts"),
      "utf8",
    );

    expect(validationsSource).toContain("export function sanitizedTextBlockSchema");
    expect(ticketRouteSource).toContain("sanitizedTextBlockSchema");
    expect(ticketReplySource).toContain("sanitizedTextBlockSchema");
    expect(adminSupportActionsSource).toContain("sanitizedTextBlockSchema");
  });

  it("uses shared sanitized name validation in admin user creation", () => {
    const adminUsersRouteSource = readFileSync(
      resolve(ROOT, "app/api/admin/users/route.ts"),
      "utf8",
    );

    expect(adminUsersRouteSource).toContain("createContactSchema.shape.name");
  });
});
