/**
 * Structured Logger — Pino with AsyncLocalStorage context injection.
 *
 * Usage:
 *   import { log } from "@/lib/logger"
 *   log.info("message sent", { recipient: "+66..." })
 *   log.error(err, "failed to send SMS")
 *
 * Context fields (requestId, correlationId, userId) are auto-attached
 * when running inside withRequestContext().
 */

import pino from "pino"
import { getRequestContext } from "./context"

const isDev = process.env.NODE_ENV !== "production"

// Base Pino instance
const baseLogger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
  // Production: raw JSON to stdout (for log aggregation)
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "apiKey",
      "secret",
      "authorization",
      "cookie",
      "token",
      "otp",
      "code",
    ],
    censor: "[REDACTED]",
  },
})

/**
 * Proxy-based logger that auto-injects request context into every log call.
 * When called outside a request context, logs without context fields.
 */
function createContextualLogger(): pino.Logger {
  return new Proxy(baseLogger, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      // Intercept log methods to inject context
      if (typeof value === "function" && isLogMethod(prop as string)) {
        return (...args: unknown[]) => {
          const ctx = getRequestContext()
          if (ctx) {
            const child = target.child({
              requestId: ctx.requestId,
              correlationId: ctx.correlationId,
              ...(ctx.userId && { userId: ctx.userId }),
              ...(ctx.method && { method: ctx.method }),
              ...(ctx.path && { path: ctx.path }),
            })
            return (child[prop as keyof pino.Logger] as (...logArgs: unknown[]) => unknown)(...args)
          }
          return value.apply(target, args)
        }
      }

      return value
    },
  })
}

function isLogMethod(name: string): boolean {
  return ["trace", "debug", "info", "warn", "error", "fatal"].includes(name)
}

/** Main contextual logger — import this everywhere. */
export const log: pino.Logger = createContextualLogger()

/** Create a child logger with a fixed component name. */
export function createComponentLogger(component: string): pino.Logger {
  return new Proxy(baseLogger.child({ component }), {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value === "function" && isLogMethod(prop as string)) {
        return (...args: unknown[]) => {
          const ctx = getRequestContext()
          if (ctx) {
            const child = target.child({
              requestId: ctx.requestId,
              correlationId: ctx.correlationId,
              ...(ctx.userId && { userId: ctx.userId }),
            })
            return (child[prop as keyof pino.Logger] as (...logArgs: unknown[]) => unknown)(...args)
          }
          return value.apply(target, args)
        }
      }
      return value
    },
  })
}
