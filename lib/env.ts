import { z } from "zod";

const WEAK_SECRETS = [
  "smsok-dev-secret-change-in-production",
  "smsok-local-dev-secret-32chars-min",
  "secret",
  "jwt-secret",
  "change-me",
];

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .refine(
      (s) => process.env.NODE_ENV !== "production" || s.length >= 32,
      "JWT_SECRET must be at least 32 characters in production"
    )
    .refine(
      (s) => process.env.NODE_ENV !== "production" || !WEAK_SECRETS.includes(s),
      "JWT_SECRET is too weak for production — use: openssl rand -hex 32"
    ),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  REDIS_URL: z.string().optional(),
  EASYTHUNDER_API_KEY: z.string().optional(),
  EASYTHUNDER_API_SECRET: z.string().optional(),
  EASYSLIP_API_KEY: z.string().optional(),
  COMMIT_SHA: z.string().default("dev"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = z.prettifyError(result.error);
    console.error("❌ Environment validation failed:");
    console.error(errors);

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }

    // In dev, return raw env to avoid crashing during build
    return process.env as unknown as Env;
  }

  _env = result.data;
  return _env;
}

// Lazy proxy — validates on first property access at runtime, not at import/build time
export const env: Env = new Proxy({} as Env, {
  get(_, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
