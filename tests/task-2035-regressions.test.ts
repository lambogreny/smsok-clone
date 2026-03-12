import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");
const schema = readFileSync(resolve(ROOT, "prisma/schema.prisma"), "utf-8");
const webhookCollectionRoute = readFileSync(resolve(ROOT, "app/api/v1/webhooks/route.ts"), "utf-8");
const webhookItemRoute = readFileSync(resolve(ROOT, "app/api/v1/webhooks/[id]/route.ts"), "utf-8");
const webhookLogsRoute = readFileSync(resolve(ROOT, "app/api/v1/webhooks/[id]/logs/route.ts"), "utf-8");
const webhookTestRoute = readFileSync(resolve(ROOT, "app/api/v1/webhooks/[id]/test/route.ts"), "utf-8");
const rotateSecretRoute = readFileSync(resolve(ROOT, "app/api/v1/webhooks/[id]/rotate-secret/route.ts"), "utf-8");
const webhookActions = readFileSync(resolve(ROOT, "lib/actions/webhooks.ts"), "utf-8");
const openApiSpec = readFileSync(resolve(ROOT, "lib/openapi-spec.ts"), "utf-8");

describe("Task #2035: webhook API backend coverage", () => {
  it("has Webhook and WebhookLog models in Prisma", () => {
    expect(schema).toContain("model Webhook {");
    expect(schema).toContain("model WebhookLog {");
    expect(schema).toContain("logs           WebhookLog[]");
  });

  it("exposes create/list/update/delete/log/test routes in v1 API", () => {
    expect(webhookCollectionRoute).toContain("export async function GET");
    expect(webhookCollectionRoute).toContain("export async function POST");
    expect(webhookItemRoute).toContain("export async function PATCH");
    expect(webhookItemRoute).toContain("export async function PUT");
    expect(webhookItemRoute).toContain("export async function DELETE");
    expect(webhookLogsRoute).toContain("export async function GET");
    expect(webhookTestRoute).toContain("export async function POST");
    expect(rotateSecretRoute).toContain("export async function POST");
  });

  it("passes authenticated user.id through webhook actions for dual-auth flows", () => {
    expect(webhookCollectionRoute).toContain("listWebhooks(user.id)");
    expect(webhookCollectionRoute).toContain("createWebhook({ url, events, userId: user.id })");
    expect(webhookItemRoute).toContain("updateWebhook(id, data, user.id)");
    expect(webhookItemRoute).toContain("deleteWebhook(id, user.id)");
    expect(webhookLogsRoute).toContain("getWebhookLogs(id, { page, limit }, user.id)");
    expect(webhookTestRoute).toContain("testWebhook(id, user.id)");
    expect(rotateSecretRoute).toContain("rotateWebhookSecret(id, user.id)");
    expect(webhookActions).toContain("async function resolveWebhookUserId");
    expect(webhookActions).toContain("apiUserId?: string");
  });

  it("documents PATCH + test route in openapi", () => {
    expect(openApiSpec).toContain('"/webhooks/{id}"');
    expect(openApiSpec).toContain("patch: {");
    expect(openApiSpec).toContain('"/webhooks/{id}/test"');
    expect(openApiSpec).toContain('"/webhooks/{id}/logs"');
  });
});
