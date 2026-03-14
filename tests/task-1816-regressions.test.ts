import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

const organizationsRolesRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/roles/route.ts"),
  "utf-8",
);
const organizationsRoleRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/roles/[roleId]/route.ts"),
  "utf-8",
);
const organizationsPermissionsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/roles/[roleId]/permissions/route.ts"),
  "utf-8",
);
const organizationsMembersRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/members/route.ts"),
  "utf-8",
);
const organizationsMemberRolesRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/members/[memberId]/roles/route.ts"),
  "utf-8",
);
const organizationsInvitesRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/invites/route.ts"),
  "utf-8",
);
const organizationsRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/route.ts"),
  "utf-8",
);
const organizationsIdRoute = readFileSync(
  resolve(ROOT, "app/api/v1/organizations/[id]/route.ts"),
  "utf-8",
);
const orderDetailRoute = readFileSync(
  resolve(ROOT, "app/api/v1/orders/[id]/route.ts"),
  "utf-8",
);
const orderService = readFileSync(
  resolve(ROOT, "lib/orders/service.ts"),
  "utf-8",
);
const organizationResolver = readFileSync(
  resolve(ROOT, "lib/organizations/resolve.ts"),
  "utf-8",
);

describe("Task #1816: organization routes accept session auth and default alias", () => {
  const routeSources = [
    organizationsRoute,
    organizationsIdRoute,
    organizationsMembersRoute,
    organizationsInvitesRoute,
    organizationsRolesRoute,
    organizationsRoleRoute,
    organizationsPermissionsRoute,
    organizationsMemberRolesRoute,
  ];

  it("uses session-aware dual auth instead of API-key-only auth", () => {
    for (const source of routeSources) {
      expect(source).toContain("authenticateRequest");
      expect(source).not.toContain("authenticatePublicApiKey");
    }
  });

  it("resolves the default organization alias before calling actions", () => {
    expect(organizationResolver).toContain('DEFAULT_ORGANIZATION_ID = "default"');
    expect(organizationResolver).toContain("resolveOrganizationIdForUser");

    for (const source of routeSources.slice(1)) {
      expect(source).toContain("resolveOrganizationIdForUser");
    }
  });
});

describe("Task #1816: billing order detail payload exposes document links", () => {
  it("loads order detail from the detailed select shape", () => {
    expect(orderDetailRoute).toContain("orderDetailSelect");
    expect(orderDetailRoute).not.toContain("orderSummarySelect");
  });

  it("serializes tax invoice, receipt, documents url, and timeline fields", () => {
    expect(orderService).toContain("tax_invoice_number");
    expect(orderService).toContain("tax_invoice_url");
    expect(orderService).toContain("receipt_number");
    expect(orderService).toContain("receipt_url");
    expect(orderService).toContain("documents: activeDocuments.map(serializeOrderDocument)");
    expect(orderService).toContain("timeline: history.map");
    expect(orderService).toContain("url: resolveStoredFilePublicUrl(document.pdfUrl) ?? document.pdfUrl ?? undefined");
  });
});
