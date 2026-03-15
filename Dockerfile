# ── Stage 1: Dependencies (cached separately for faster rebuilds) ──
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
ENV HUSKY=0
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile --ignore-scripts 2>/dev/null || bun install --ignore-scripts

# ── Stage 2: Build (only rebuilds when source changes) ──
FROM oven/bun:1 AS builder
WORKDIR /app
ARG COMMIT_SHA=dev
ENV NEXT_TELEMETRY_DISABLED=1 COMMIT_SHA=$COMMIT_SHA

# Copy deps first (cached from stage 1)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./

# Copy config files (rarely change → cached)
COPY next.config.ts tsconfig.json next-env.d.ts postcss.config.mjs ./

# Copy prisma schema (generate client)
COPY prisma ./prisma
RUN bunx prisma generate

# Copy source (changes most often → last layer)
COPY middleware.ts ./
COPY app ./app
COPY components ./components
COPY config ./config
COPY hooks ./hooks
COPY lib ./lib
COPY providers ./providers
COPY stores ./stores
COPY types ./types
COPY workers ./workers
COPY public ./public

# Dummy env vars for build-time validation (NOT used in production)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV JWT_SECRET=build-only-dummy-secret-not-used-in-production
ENV REDIS_URL=redis://localhost:6379
ENV REDIS_HOST=localhost
ENV REDIS_PORT=6379
ENV OTP_HASH_SECRET=build-only-dummy-otp-hash-secret

RUN bun run build

# ── Stage 3: Production (minimal — no build tools) ──
FROM node:22-slim AS production
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends openssl curl tini && \
    rm -rf /var/lib/apt/lists/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
WORKDIR /app

ARG SOURCE_REPOSITORY=https://github.com/lambogreny/smsok-clone
LABEL org.opencontainers.image.source=$SOURCE_REPOSITORY

# Copy only what's needed for runtime
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

ARG COMMIT_SHA=dev
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1 COMMIT_SHA=$COMMIT_SHA
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1

ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
