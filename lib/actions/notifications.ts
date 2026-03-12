
import { sendEmail } from "../resend";
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  invoiceEmail,
  creditLowEmail,
  campaignSummaryEmail,
  securityAlertEmail,
} from "../email-templates";
import { prisma as db } from "../db";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}

// ---------------------------------------------------------------------------
// 1. Welcome
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(userId: string) {
  try {
    const user = await getUser(userId);
    if (!user) return;

    const tpl = welcomeEmail(user.name);
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "welcome" }],
    });
  } catch (error) {
    console.error("[notifications] sendWelcomeEmail failed:", error);
  }
}

// ---------------------------------------------------------------------------
// 2. Verification
// ---------------------------------------------------------------------------

export async function sendVerificationEmail(userId: string, code: string) {
  try {
    const user = await getUser(userId);
    if (!user) return;

    const tpl = verificationEmail(user.name, code);
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "verification" }],
    });
  } catch (error) {
    console.error("[notifications] sendVerificationEmail failed:", error);
  }
}

// ---------------------------------------------------------------------------
// 3. Password Reset
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });
    if (!user) return;

    const tpl = passwordResetEmail(user.name, resetUrl);
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "password-reset" }],
    });
  } catch (error) {
    console.error("[notifications] sendPasswordResetEmail failed:", error);
  }
}

// ---------------------------------------------------------------------------
// 4. Invoice
// ---------------------------------------------------------------------------

export async function sendInvoiceEmail(userId: string, transactionId: string) {
  try {
    const user = await getUser(userId);
    if (!user) return;

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        reference: true,
      },
    });
    if (!transaction) return;

    const tpl = invoiceEmail(user.name, {
      invoiceNumber: transaction.reference || transaction.id.slice(-8).toUpperCase(),
      amount: transaction.amount,
      credits: 0, // legacy — package system
      date: transaction.createdAt.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "invoice" }],
    });
  } catch (error) {
    console.error("[notifications] sendInvoiceEmail failed:", error);
  }
}

// ---------------------------------------------------------------------------
// 5. Credit Low Warning
// ---------------------------------------------------------------------------

export async function sendSmsLowWarning(userId: string) {
  try {
    const { getRemainingQuota } = await import("../package/quota");
    const quota = await getRemainingQuota(userId);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return;

    const threshold = 10;
    if (quota.totalRemaining > threshold) return;

    const tpl = creditLowEmail(user.name, {
      currentCredits: quota.totalRemaining,
      threshold,
    });
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "credit-low" }],
    });
  } catch (error) {
    console.error("[notifications] sendCreditLowWarning failed:", error);
  }
}

// ---------------------------------------------------------------------------
// 6. Campaign Summary
// ---------------------------------------------------------------------------

export async function sendCampaignSummary(userId: string, campaignId: string) {
  try {
    const user = await getUser(userId);
    if (!user) return;

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      select: {
        name: true,
        totalRecipients: true,
        sentCount: true,
        deliveredCount: true,
        failedCount: true,
      },
    });
    if (!campaign) return;

    const total = campaign.totalRecipients;
    const sent = campaign.deliveredCount || campaign.sentCount;
    const failed = campaign.failedCount;
    const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

    const tpl = campaignSummaryEmail(user.name, {
      campaignName: campaign.name,
      sent,
      failed,
      total,
      deliveryRate,
    });
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "campaign-summary" }],
    });
  } catch (error) {
    console.error("[notifications] sendCampaignSummary failed:", error);
  }
}

// ---------------------------------------------------------------------------
// 7. Security Alert
// ---------------------------------------------------------------------------

export async function sendSecurityAlert(
  userId: string,
  action: string,
  ip: string,
  userAgent: string
) {
  try {
    const user = await getUser(userId);
    if (!user) return;

    const tpl = securityAlertEmail(user.name, {
      action,
      ip,
      userAgent,
      timestamp: new Date().toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    await sendEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      tags: [{ name: "type", value: "security-alert" }],
    });
  } catch (error) {
    console.error("[notifications] sendSecurityAlert failed:", error);
  }
}
