/**
 * Queue an email for async delivery via BullMQ.
 * Checks NotificationPrefs before queuing (respects user opt-out).
 */

import { emailQueue } from "./queue/queues"
import { type EmailTemplate } from "./queue/types"
import { prisma } from "./db"
import { randomUUID } from "crypto"

// Map template → NotificationPrefs field
const PREF_MAP: Partial<Record<EmailTemplate, string>> = {
  credit_low: "emailCreditLow",
  campaign_summary: "emailCampaignDone",
  weekly_report: "emailWeeklyReport",
  package_expiry: "emailPackageExpiry",
  invoice: "emailInvoice",
  security_alert: "emailSecurity",
}

export async function queueEmail(opts: {
  to: string | string[]
  template: EmailTemplate
  data: Record<string, unknown>
  userId?: string
  skipPrefCheck?: boolean
}) {
  // Check notification preferences if userId provided
  if (opts.userId && !opts.skipPrefCheck) {
    const prefField = PREF_MAP[opts.template]
    if (prefField) {
      const prefs = await prisma.notificationPrefs.findUnique({
        where: { userId: opts.userId },
      })
      if (prefs && (prefs as Record<string, unknown>)[prefField] === false) {
        return null // User opted out
      }
    }
  }

  const job = await emailQueue.add(opts.template, {
    correlationId: randomUUID(),
    to: opts.to,
    template: opts.template,
    data: opts.data,
    userId: opts.userId,
    tags: [{ name: "template", value: opts.template }],
  })

  return { jobId: job.id }
}
