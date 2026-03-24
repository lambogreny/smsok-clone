FROM node:24-slim
WORKDIR /app

RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV JWT_SECRET=build-only-dummy-secret-not-used-in-production
ENV REDIS_URL=redis://localhost:6379
ENV OTP_HASH_SECRET=build-only-dummy-otp-hash-secret

RUN bunx prisma generate
RUN bun run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["bun", "run", "start"]
