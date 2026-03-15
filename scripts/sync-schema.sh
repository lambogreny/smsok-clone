#!/bin/bash
# Schema Sync: smsok-clone (master) → smsok-backoffice
# smsok-clone is the SINGLE SOURCE OF TRUTH for schema.prisma

SOURCE="/Users/lambogreny/oracles/smsok-clone/prisma/schema.prisma"
TARGET="/Users/lambogreny/oracles/smsok-backoffice/prisma/schema.prisma"

echo "Syncing schema.prisma: smsok-clone → smsok-backoffice"
cp "$SOURCE" "$TARGET"
echo "✅ Schema synced!"
echo "Run in smsok-backoffice: npx prisma generate && npx prisma db push"
