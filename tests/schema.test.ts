import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");

describe("Prisma Schema: Models", () => {
  it("has User model", () => {
    expect(schema).toContain("model User");
  });

  it("has Message model", () => {
    expect(schema).toContain("model Message");
  });

  it("has ApiKey model", () => {
    expect(schema).toContain("model ApiKey");
  });

  it("has Contact model", () => {
    expect(schema).toContain("model Contact");
  });

  it("has Tag model", () => {
    expect(schema).toContain("model Tag");
  });

  it("has ContactTag model", () => {
    expect(schema).toContain("model ContactTag");
  });

  it("has ContactGroup model", () => {
    expect(schema).toContain("model ContactGroup");
  });

  it("has ContactGroupMember model", () => {
    expect(schema).toContain("model ContactGroupMember");
  });

  it("has SenderName model", () => {
    expect(schema).toContain("model SenderName");
  });

  it("has Package model", () => {
    expect(schema).toContain("model Package");
  });

  it("has Transaction model", () => {
    expect(schema).toContain("model Transaction");
  });

  it("has Campaign model", () => {
    expect(schema).toContain("model Campaign");
  });

  it("has OtpRequest model", () => {
    expect(schema).toContain("model OtpRequest");
  });
});

describe("Prisma Schema: User defaults", () => {
  it("credits field exists in schema", () => {
    expect(schema).toContain("credits");
  });

  it("role default user", () => {
    expect(schema).toContain('@default("user")');
  });

  it("emailVerified default false", () => {
    expect(schema).toContain("@default(false)");
  });

  it("email is unique", () => {
    expect(schema).toMatch(/email\s+String\s+@unique/);
  });
});

describe("Prisma Schema: Message", () => {
  it("status default pending", () => {
    expect(schema).toContain('@default("pending")');
  });

  it("creditCost default 1", () => {
    expect(schema).toContain("@default(1)");
  });

  it("has userId + createdAt index", () => {
    expect(schema).toContain("@@index([userId, createdAt])");
  });

  it("has status index", () => {
    expect(schema).toContain("@@index([status])");
  });
});

describe("Prisma Schema: ApiKey", () => {
  it("key is unique", () => {
    expect(schema).toMatch(/key\s+String\s+@unique/);
  });

  it("isActive default true", () => {
    expect(schema).toContain("@default(true)");
  });

  it("has key index", () => {
    expect(schema).toContain("@@index([key])");
  });
});

describe("Prisma Schema: Contact", () => {
  it("has unique userId+phone constraint", () => {
    expect(schema).toContain("@@unique([userId, phone])");
  });

  it("has userId index", () => {
    expect(schema).toContain("@@index([userId])");
  });
});

describe("Prisma Schema: ContactGroupMember", () => {
  it("has unique groupId+contactId", () => {
    expect(schema).toContain("@@unique([groupId, contactId])");
  });

  it("cascade deletes on group", () => {
    expect(schema).toContain("onDelete: Cascade");
  });
});

describe("Prisma Schema: Contact Tags", () => {
  it("has unique contactId+tagId", () => {
    expect(schema).toContain("@@unique([contactId, tagId])");
  });

  it("has unique userId+name for tags", () => {
    const tagBlock = schema.slice(schema.indexOf("model Tag"), schema.indexOf("model ContactTag"));
    expect(tagBlock).toContain("@@unique([userId, name])");
  });
});

describe("Prisma Schema: SenderName", () => {
  it("has unique userId+name", () => {
    expect(schema).toContain("@@unique([userId, name])");
  });

  it("status default pending", () => {
    // Multiple @default("pending") in schema — just ensure it exists
    const senderBlock = schema.slice(
      schema.indexOf("model SenderName"),
      schema.indexOf("model Package")
    );
    expect(senderBlock).toContain('@default("pending")');
  });
});

describe("Prisma Schema: Package", () => {
  it("has isActive flag", () => {
    expect(schema).toContain("isActive");
  });

  it("has isTrial flag", () => {
    expect(schema).toContain("isTrial");
  });

  it("has maxSenders default 5", () => {
    expect(schema).toContain("@default(5)");
  });
});

describe("Prisma Schema: Transaction", () => {
  it("has userId+createdAt index", () => {
    const txBlock = schema.slice(schema.indexOf("model Transaction"));
    expect(txBlock).toContain("@@index([userId, createdAt])");
  });

  it("has status index", () => {
    const txBlock = schema.slice(schema.indexOf("model Transaction"));
    expect(txBlock).toContain("@@index([status])");
  });

  it("has expiresAt field", () => {
    expect(schema).toContain("expiresAt");
  });
});

describe("Prisma Schema: OTP", () => {
  it("stores refCode uniquely", () => {
    const otpBlock = schema.slice(
      schema.indexOf("model OtpRequest"),
      schema.indexOf("model ScheduledSms")
    );
    expect(otpBlock).toContain("refCode");
    expect(otpBlock).toContain("@unique");
  });
});

describe("Prisma Schema: Campaign", () => {
  it("has draft default status", () => {
    const campaignBlock = schema.slice(
      schema.indexOf("model Campaign"),
      schema.indexOf("model ScheduledSms")
    );
    expect(campaignBlock).toContain('@default("DRAFT")');
  });

  it("tracks credit reservation", () => {
    const campaignBlock = schema.slice(
      schema.indexOf("model Campaign"),
      schema.indexOf("model ScheduledSms")
    );
    expect(campaignBlock).toContain("creditReserved");
    expect(campaignBlock).toContain("creditUsed");
  });
});
