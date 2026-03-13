import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();

const registerPageSource = readFileSync(resolve(ROOT, "app/(auth)/register/page.tsx"), "utf-8");

describe("Task #2805: register consent uses disable-only gating", () => {
  it("removes consent validation copy and keeps the submit button disabled until required checkboxes are checked", () => {
    expect(registerPageSource).not.toContain("กรุณายอมรับข้อกำหนดการใช้งาน");
    expect(registerPageSource).not.toContain("กรุณายอมรับการส่งข้อมูลให้ผู้ให้บริการภายนอก");
    expect(registerPageSource).toContain("if (!data.consentService || !data.consentThirdParty) {");
    expect(registerPageSource).toContain("disabled={isSubmitting || !termsAccepted}");
  });
});
