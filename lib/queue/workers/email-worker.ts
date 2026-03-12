/**
 * Email Worker — BullMQ worker for async email delivery via Resend.
 * Maps EmailJobData.template → email-templates.ts function → sendEmail()
 */

import { Worker, type Job } from "bullmq"
import { workerConnectionOptions } from "../connection"
import { QUEUE_NAMES, QUEUE_CONFIG, type EmailJobData, type EmailJobResult } from "../types"
import { sendEmail } from "@/lib/resend"
import {
  welcomeEmail,
  verificationEmail,
  passwordResetEmail,
  invoiceEmail,
  creditLowEmail,
  campaignSummaryEmail,
  securityAlertEmail,
  weeklyReportEmail,
} from "@/lib/email-templates"

type EmailContent = { subject: string; html: string; text?: string }

function renderTemplate(template: string, data: Record<string, unknown>): EmailContent {
  const name = (data.name as string) || "คุณลูกค้า"

  switch (template) {
    case "welcome":
      return welcomeEmail(name)

    case "verification":
      return verificationEmail(name, data.code as string)

    case "password_reset":
      return passwordResetEmail(name, data.resetUrl as string)

    case "invoice":
      return invoiceEmail(name, {
        invoiceNumber: data.invoiceNumber as string,
        amount: data.amount as number,
        credits: data.credits as number,
        date: data.date as string,
        pdfUrl: data.pdfUrl as string | undefined,
      })

    case "credit_low":
      return creditLowEmail(name, {
        currentCredits: data.currentCredits as number,
        threshold: data.threshold as number,
      })

    case "campaign_summary":
      return campaignSummaryEmail(name, {
        campaignName: data.campaignName as string,
        sent: data.sent as number,
        failed: data.failed as number,
        total: data.total as number,
        deliveryRate: data.deliveryRate as number,
      })

    case "security_alert":
      return securityAlertEmail(name, {
        action: data.action as string,
        ip: data.ip as string,
        userAgent: data.userAgent as string,
        timestamp: data.timestamp as string,
      })

    case "weekly_report":
      return weeklyReportEmail(name, {
        smsSent: data.smsSent as number,
        credits: data.credits as number,
        campaigns: data.campaigns as number,
        period: data.period as string,
      })

    case "package_expiry":
      return {
        subject: "แพ็กเกจ SMS ของคุณใกล้หมดอายุ — SMSOK",
        html: `<p>สวัสดี ${name},</p><p>แพ็กเกจ ${data.packageName} จะหมดอายุในวันที่ ${data.expiryDate} เครดิตคงเหลือ ${data.remaining} SMS กรุณาต่ออายุก่อนหมดอายุเพื่อไม่ให้เสียเครดิต</p>`,
        text: `แพ็กเกจ ${data.packageName} จะหมดอายุ ${data.expiryDate} เครดิตคงเหลือ ${data.remaining} SMS`,
      }

    case "purchase_confirmation":
      return {
        subject: "ยืนยันการซื้อสำเร็จ — SMSOK",
        html: `<p>สวัสดี ${name},</p><p>การซื้อแพ็กเกจ ${data.packageName} จำนวน ${data.credits} SMS สำเร็จแล้ว (${data.amount} บาท)</p>`,
        text: `ซื้อ ${data.packageName} ${data.credits} SMS สำเร็จ (${data.amount} บาท)`,
      }

    default:
      throw new Error(`Unknown email template: ${template}`)
  }
}

async function processEmailJob(job: Job<EmailJobData>): Promise<EmailJobResult> {
  const { to, template, data, tags } = job.data

  const content = renderTemplate(template, data)

  const result = await sendEmail({
    to,
    subject: content.subject,
    html: content.html,
    text: content.text,
    tags,
  })

  return {
    resendId: result?.id,
    success: true,
  }
}

const config = QUEUE_CONFIG[QUEUE_NAMES.EMAIL]

export function createEmailWorker() {
  const worker = new Worker<EmailJobData, EmailJobResult>(
    QUEUE_NAMES.EMAIL,
    processEmailJob,
    {
      connection: workerConnectionOptions,
      concurrency: config.concurrency,
      limiter: "rateLimit" in config ? { max: config.rateLimit.max, duration: config.rateLimit.duration } : undefined,
    }
  )

  worker.on("failed", (job, err) => {
    console.error(`[email-worker] Job ${job?.id} failed:`, err.message)
  })

  return worker
}
