import { z } from "zod";

const WEAK_SECRETS = [
  "smsok-dev-secret-change-in-production",
  "smsok-local-dev-secret-32chars-min",
  "secret",
  "jwt-secret",
  "change-me",
];

const DEV_REDIS_URL = "redis://localhost:6379";
const DEV_COMPANY_INFO = {
  name: "บริษัท เอสเอ็มเอสโอเค จำกัด",
  taxId: "0105566000000",
  branch: "สำนักงานใหญ่",
  address: "123 อาคาร ABC ชั้น 10 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  phone: "LINE: @smsok",
  email: "billing@smsok.com",
};
const DEV_DOCUMENT_VERIFY_BASE_URL = "https://smsok.9phum.me";

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
  ADMIN_JWT_SECRET: z.string()
    .min(16, "ADMIN_JWT_SECRET must be at least 16 characters")
    .refine(
      (s) => process.env.NODE_ENV !== "production" || s.length >= 32,
      "ADMIN_JWT_SECRET must be at least 32 characters in production"
    )
    .refine(
      (s) => process.env.NODE_ENV !== "production" || !WEAK_SECRETS.includes(s),
      "ADMIN_JWT_SECRET is too weak for production — use: openssl rand -hex 32"
    )
    .optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  REDIS_URL: z.string().url().optional(),
  EASYTHUNDER_API_KEY: z.string().optional(),
  EASYTHUNDER_API_SECRET: z.string().optional(),
  EASYSLIP_API_KEY: z.string().optional(),
  EASYSLIP_API_URL: z.string().url().optional(),
  SLIPOK_BRANCH_ID: z.string().optional(),
  SLIPOK_API_KEY: z.string().optional(),
  R2_PUBLIC_URL: z.string().url("R2_PUBLIC_URL must be a valid URL").optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_BUCKET: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  BACKOFFICE_APP_URL: z.string().url().optional(),
  DOCUMENT_VERIFY_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL: z.string().url().optional(),
  COMPANY_NAME: z.string().min(1).optional(),
  COMPANY_TAX_ID: z.string().min(1).optional(),
  COMPANY_BRANCH: z.string().min(1).optional(),
  COMPANY_ADDRESS: z.string().min(1).optional(),
  COMPANY_PHONE: z.string().min(1).optional(),
  COMPANY_EMAIL: z.string().email().optional(),
  COMMIT_SHA: z.string().default("dev"),
  TWO_FA_ENCRYPTION_KEY: z.string()
    .min(32, "TWO_FA_ENCRYPTION_KEY must be at least 32 characters")
    .optional(),
}).superRefine((value, ctx) => {
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (value.NODE_ENV !== "production" || isBuildPhase) return;

  if (!value.REDIS_URL?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["REDIS_URL"],
      message: "REDIS_URL is required in production",
    });
  }

  if (!value.ADMIN_JWT_SECRET?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ADMIN_JWT_SECRET"],
      message: "ADMIN_JWT_SECRET is required in production",
    });
  } else if (value.ADMIN_JWT_SECRET === value.JWT_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ADMIN_JWT_SECRET"],
      message: "ADMIN_JWT_SECRET must be different from JWT_SECRET in production",
    });
  }

  if (!value.NEXT_PUBLIC_APP_URL?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["NEXT_PUBLIC_APP_URL"],
      message: "NEXT_PUBLIC_APP_URL is required in production",
    });
  }

  if (!value.BACKOFFICE_APP_URL?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["BACKOFFICE_APP_URL"],
      message: "BACKOFFICE_APP_URL is required in production",
    });
  }

  if (/^postgres(ql)?:\/\//i.test(value.DATABASE_URL)) {
    try {
      const databaseUrl = new URL(value.DATABASE_URL);
      const rawConnectionLimit = databaseUrl.searchParams.get("connection_limit");
      const connectionLimit = rawConnectionLimit ? Number(rawConnectionLimit) : Number.NaN;

      if (!Number.isInteger(connectionLimit) || connectionLimit < 1 || connectionLimit > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "DATABASE_URL must include connection_limit=1..20 in production",
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL must be a valid PostgreSQL URL",
      });
    }
  }

  for (const key of [
    "COMPANY_NAME",
    "COMPANY_TAX_ID",
    "COMPANY_BRANCH",
    "COMPANY_ADDRESS",
    "COMPANY_PHONE",
    "COMPANY_EMAIL",
  ] as const) {
    if (!value[key]?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [key],
        message: `${key} is required in production`,
      });
    }
  }

  if (
    !value.DOCUMENT_VERIFY_BASE_URL?.trim() &&
    !value.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL?.trim() &&
    !value.NEXT_PUBLIC_APP_URL?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["DOCUMENT_VERIFY_BASE_URL"],
      message: "DOCUMENT_VERIFY_BASE_URL or NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL or NEXT_PUBLIC_APP_URL is required in production",
    });
  }
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
    const errors = z.prettifyError(result.error);
    console.error("❌ Environment validation failed:");
    console.error(errors);

    if (process.env.NODE_ENV === "production" && !isBuildPhase) {
      process.exit(1);
    }

    // In dev or during build, return raw env to avoid crashing
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

function isRuntimeProdStrict() {
  return process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build";
}

function resolveRuntimeStringEnv(
  key: keyof Env,
  developmentFallback?: string,
) {
  const value = getEnv()[key];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (!isRuntimeProdStrict() && developmentFallback !== undefined) {
    return developmentFallback;
  }
  throw new Error(`${String(key)} ไม่ได้ตั้งค่า`);
}

export function getRedisUrl() {
  return resolveRuntimeStringEnv("REDIS_URL", DEV_REDIS_URL);
}

export function getCompanyInfo() {
  return {
    name: resolveRuntimeStringEnv("COMPANY_NAME", DEV_COMPANY_INFO.name),
    taxId: resolveRuntimeStringEnv("COMPANY_TAX_ID", DEV_COMPANY_INFO.taxId),
    branch: resolveRuntimeStringEnv("COMPANY_BRANCH", DEV_COMPANY_INFO.branch),
    address: resolveRuntimeStringEnv("COMPANY_ADDRESS", DEV_COMPANY_INFO.address),
    phone: resolveRuntimeStringEnv("COMPANY_PHONE", DEV_COMPANY_INFO.phone),
    email: resolveRuntimeStringEnv("COMPANY_EMAIL", DEV_COMPANY_INFO.email),
  };
}

export function getDocumentVerificationBaseUrl() {
  const configuredBaseUrl =
    getEnv().DOCUMENT_VERIFY_BASE_URL?.trim() ||
    getEnv().NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL?.trim() ||
    getEnv().NEXT_PUBLIC_APP_URL?.trim();

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (!isRuntimeProdStrict()) {
    return DEV_DOCUMENT_VERIFY_BASE_URL;
  }

  throw new Error("DOCUMENT_VERIFY_BASE_URL ไม่ได้ตั้งค่า");
}
