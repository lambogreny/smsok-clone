#!/bin/bash
set -euo pipefail

echo "🧪 Pre-deploy checks..."

echo "1/4 — Lint & type check..."
bun run lint
bunx tsc --noEmit

echo "2/4 — Unit tests..."
bun run test:ci

echo "3/4 — Build..."
bun run build

echo "4/4 — E2E tests..."
bun run test:e2e

echo "✅ All checks passed — safe to deploy!"
