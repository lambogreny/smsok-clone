import { describe, expect, it } from "vitest";
import { GET as getAutoTopup } from "@/app/api/v1/packages/auto-topup/route";
import { creditLowEmail, welcomeEmail, weeklyReportEmail } from "@/lib/email-templates";

describe("Task #2550: backend terminology cleanup", () => {
  it("uses message/package terminology in customer-facing emails", () => {
    const welcome = welcomeEmail("สมชาย");
    const lowQuota = creditLowEmail("สมหญิง", { currentCredits: 20, threshold: 50 });
    const weekly = weeklyReportEmail("สมศรี", {
      smsSent: 120,
      credits: 320,
      campaigns: 3,
      period: "2026-03-01 ถึง 2026-03-07",
    });

    expect(welcome.html).toContain("ข้อความทดลองใช้ฟรี");
    expect(welcome.html).toContain("บาท/ข้อความ");
    expect(welcome.html).not.toContain("15 SMS ฟรี");
    expect(lowQuota.subject).toContain("โควต้าข้อความ");
    expect(lowQuota.text).toContain("ซื้อแพ็กเกจข้อความ");
    expect(weekly.html).toContain("ข้อความที่ส่ง");
    expect(weekly.text).not.toContain("SMS ที่ส่ง");
  });

  it("renames deprecated auto-topup messaging to package-purchase terminology", async () => {
    const response = await getAutoTopup();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      error: "การซื้อแพ็กเกจอัตโนมัติถูกยกเลิกแล้ว ใช้การซื้อแพ็กเกจและแนบสลิปตามขั้นตอนใหม่แทน",
    });
  });
});
