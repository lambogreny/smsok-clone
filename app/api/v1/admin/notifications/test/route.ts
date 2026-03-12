import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-auth";
import { authenticateAdmin } from "@/lib/admin-auth";
import { testNotificationSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/resend";
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  invoiceEmail,
  creditLowEmail,
  campaignSummaryEmail,
  securityAlertEmail,
  weeklyReportEmail,
} from "@/lib/email-templates";

type TemplateResult = { subject: string; html: string; text: string };

const TEMPLATE_MAP: Record<string, (data: Record<string, unknown>) => TemplateResult> = {
  welcome: (d) => welcomeEmail((d.name as string) || "Test User"),
  verification: (d) => verificationEmail((d.name as string) || "Test User", (d.code as string) || "123456"),
  "password-reset": (d) =>
    passwordResetEmail((d.name as string) || "Test User", (d.resetUrl as string) || "https://smsok.io/reset/test"),
  invoice: (d) =>
    invoiceEmail((d.name as string) || "Test User", {
      invoiceNumber: (d.invoiceNumber as string) || "INV-0001",
      amount: (d.amount as number) || 500,
      credits: (d.credits as number) || 1000,
      date: (d.date as string) || new Date().toLocaleDateString("th-TH"),
      pdfUrl: d.pdfUrl as string | undefined,
    }),
  "credit-low": (d) =>
    creditLowEmail((d.name as string) || "Test User", {
      currentCredits: (d.currentCredits as number) || 5,
      threshold: (d.threshold as number) || 10,
    }),
  "campaign-summary": (d) =>
    campaignSummaryEmail((d.name as string) || "Test User", {
      campaignName: (d.campaignName as string) || "Test Campaign",
      sent: (d.sent as number) || 950,
      failed: (d.failed as number) || 50,
      total: (d.total as number) || 1000,
      deliveryRate: (d.deliveryRate as number) || 95.0,
    }),
  "security-alert": (d) =>
    securityAlertEmail((d.name as string) || "Test User", {
      action: (d.action as string) || "เข้าสู่ระบบ",
      ip: (d.ip as string) || "203.0.113.42",
      userAgent: (d.userAgent as string) || "Chrome / macOS",
      timestamp: (d.timestamp as string) || new Date().toLocaleString("th-TH"),
    }),
  "weekly-report": (d) =>
    weeklyReportEmail((d.name as string) || "Test User", {
      smsSent: (d.smsSent as number) || 1234,
      credits: (d.credits as number) || 5678,
      campaigns: (d.campaigns as number) || 3,
      period: (d.period as string) || "4 - 10 มี.ค. 2026",
    }),
};

export async function POST(req: NextRequest) {
  try {
    await authenticateAdmin(req);

    const body = await req.json();
    const { template, to, data } = testNotificationSchema.parse(body);

    const templateFn = TEMPLATE_MAP[template];
    if (!templateFn) {
      return apiResponse(
        {
          error: `Unknown template: ${template}`,
          available: Object.keys(TEMPLATE_MAP),
        },
        400
      );
    }

    const tpl = templateFn(data);
    const result = await sendEmail({
      to,
      subject: `[TEST] ${tpl.subject}`,
      html: tpl.html,
      text: tpl.text,
      tags: [
        { name: "type", value: "test" },
        { name: "template", value: template },
      ],
    });

    return apiResponse({ ok: true, template, to, emailId: result?.id ?? null });
  } catch (error) {
    return apiError(error);
  }
}
