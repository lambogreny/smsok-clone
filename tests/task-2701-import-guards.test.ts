import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  requireApiPermission: vi.fn(),
  contactGroupFindFirst: vi.fn(),
}));

vi.mock("@/lib/api-auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api-auth")>("@/lib/api-auth");
  return {
    ...actual,
    authenticateRequest: mocks.authenticateRequest,
  };
});

vi.mock("@/lib/rbac", () => ({
  requireApiPermission: mocks.requireApiPermission,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    contactGroup: {
      findFirst: mocks.contactGroupFindFirst,
    },
    contact: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    contactGroupMember: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/actions/excel-import", () => ({
  importContactsFromExcel: vi.fn(),
  parseExcelFile: vi.fn(),
}));

import { POST as importContacts } from "@/app/api/v1/contacts/import/route";
import { POST as importGroupContacts } from "@/app/api/v1/groups/[id]/import/route";

function buildJsonRequest(body: unknown) {
  return {
    headers: new Headers({ "content-type": "application/json" }),
    json: vi.fn().mockResolvedValue(body),
  } as never;
}

function buildMultipartRequest(file: { name: string; type: string; size: number; text(): Promise<string> }) {
  return {
    headers: new Headers({ "content-type": "multipart/form-data; boundary=test" }),
    formData: vi.fn().mockResolvedValue({
      get: (key: string) => (key === "file" ? file : null),
    }),
  } as never;
}

describe("Task #2701: import guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticateRequest.mockResolvedValue({ id: "user_1" });
    mocks.requireApiPermission.mockResolvedValue(null);
    mocks.contactGroupFindFirst.mockResolvedValue({ id: "group_1" });
  });

  it("rejects contacts JSON arrays larger than 5,000 rows", async () => {
    const response = await importContacts(
      buildJsonRequest({
        contacts: Array.from({ length: 5001 }, (_, index) => ({
          name: `Contact ${index + 1}`,
          phone: "0812345678",
        })),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects contacts CSV payloads larger than 5,000 rows", async () => {
    const csv = [
      "name,phone",
      ...Array.from({ length: 5001 }, (_, index) => `Contact ${index + 1},0812345678`),
    ].join("\n");

    const response = await importContacts(buildJsonRequest({ data: csv }));

    expect(response.status).toBe(400);
  });

  it("rejects unsupported multipart file types for contacts import", async () => {
    const response = await importContacts(
      buildMultipartRequest({
        name: "contacts.gif",
        type: "image/gif",
        size: 128,
        text: vi.fn().mockResolvedValue("gif"),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("rejects group JSON arrays larger than 5,000 rows", async () => {
    const response = await importGroupContacts(
      buildJsonRequest({
        contacts: Array.from({ length: 5001 }, (_, index) => ({
          name: `Contact ${index + 1}`,
          phone: "0812345678",
        })),
      }),
      { params: Promise.resolve({ id: "group_1" }) },
    );

    expect(response.status).toBe(400);
  });

  it("rejects unsupported multipart file types for group import", async () => {
    const response = await importGroupContacts(
      buildMultipartRequest({
        name: "contacts.gif",
        type: "image/gif",
        size: 128,
        text: vi.fn().mockResolvedValue("gif"),
      }),
      { params: Promise.resolve({ id: "group_1" }) },
    );

    expect(response.status).toBe(400);
  });
});
