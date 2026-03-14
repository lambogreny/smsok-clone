/**
 * Alert Rules Configuration
 * Defines thresholds for monitoring alerts.
 * Channels: console (now), Slack/LINE Notify (future)
 */

import { logger } from "@/lib/logger";

export const ALERT_RULES = {
  errorRate: {
    threshold: 5, // percent
    windowMs: 5 * 60_000, // 5 min window
    message: "Error rate exceeds 5%",
  },
  smsDeliveryRate: {
    threshold: 95, // percent (alert if BELOW this)
    windowMs: 60 * 60_000, // 1 hour window
    message: "SMS delivery rate below 95%",
  },
  creditBalanceLow: {
    threshold: 100, // credits remaining
    message: "SMS เหลือน้อยกว่า 100 ข้อความ",
  },
  apiLatency: {
    threshold: 2000, // ms
    message: "API latency exceeds 2s",
  },
  queueBacklog: {
    threshold: 10000, // jobs waiting
    message: "Queue backlog exceeds 10,000 jobs",
  },
  redisMemory: {
    threshold: 80, // percent of maxmemory
    message: "Redis memory usage above 80%",
  },
} as const;

export type AlertType = keyof typeof ALERT_RULES;

export type AlertChannel = "console" | "slack" | "line_notify" | "email";

const ACTIVE_CHANNELS: AlertChannel[] = ["console"];

export function triggerAlert(type: AlertType, details?: Record<string, unknown>) {
  const rule = ALERT_RULES[type];

  for (const channel of ACTIVE_CHANNELS) {
    switch (channel) {
      case "console":
        logger.warn(`ALERT: ${rule.message}`, { alert: type, ...details });
        break;
      case "slack":
        logger.debug("alert channel not configured", { channel, alert: type });
        break;
      case "line_notify":
        logger.debug("alert channel not configured", { channel, alert: type });
        break;
      case "email":
        logger.debug("alert channel not configured", { channel, alert: type });
        break;
    }
  }
}
