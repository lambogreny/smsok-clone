FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
  bun install --frozen-lockfile 2>/dev/null || bun install

FROM oven/bun:1 AS builder
WORKDIR /app
ARG COMMIT_SHA=dev
ENV NEXT_TELEMETRY_DISABLED=1 COMMIT_SHA=$COMMIT_SHA
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* next.config.ts tsconfig.json next-env.d.ts postcss.config.mjs ./
COPY middleware.ts ./middleware.ts
COPY app ./app
COPY components ./components
COPY hooks ./hooks
COPY lib ./lib
COPY providers ./providers
COPY stores ./stores
COPY prisma ./prisma
COPY public ./public
RUN bunx prisma generate && bun run build

FROM node:22-slim
RUN apt-get update -qq && \
    apt-get install -y -qq --no-install-recommends openssl curl tini && \
    rm -rf /var/lib/apt/lists/* && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
WORKDIR /app
ARG SOURCE_REPOSITORY=https://github.com/lambogreny/smsok-clone
LABEL org.opencontainers.image.source=$SOURCE_REPOSITORY
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
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1
ENTRYPOINT ["tini", "--"]
CMD ["node", "server.js"]
