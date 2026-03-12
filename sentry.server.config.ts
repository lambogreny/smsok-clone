import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NODE_ENV,
  release: process.env.COMMIT_SHA || "dev",

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0.1,

  beforeSend(event) {
    const status = event.contexts?.response?.status_code;
    if (status === 401 || status === 403 || status === 429) return null;
    return event;
  },
});
