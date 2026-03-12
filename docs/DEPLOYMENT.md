# SMSOK Clone — Deployment Guide

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 22+ | Runtime (production container) |
| Bun | 1.x | Package manager + dev runtime |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Caching, rate limiting, queues |
| Docker | 24+ | Container runtime |
| Docker Compose | v2 | Service orchestration |

## 2. Local Development Setup

```bash
# Clone repository
git clone https://github.com/lambogreny/smsok-clone.git
cd smsok-clone

# Install dependencies
bun install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Copy environment file (safe dev values included)
# .env.development is committed — no changes needed for local dev

# Push schema to database
bunx prisma db push

# Generate Prisma client
bunx prisma generate

# Seed initial data (9 package tiers + admin users)
bun prisma/seed.ts

# Start development server
bun dev
# App available at http://localhost:3000
```

### Local Ports

| Service | Port | Notes |
|---------|------|-------|
| Next.js | 3000 | Dev server with hot reload |
| PostgreSQL | 5434 | Mapped from container 5432 |
| Redis | 6380 | Mapped from container 6379 |

## 3. Docker Deployment (Development)

Run the full stack in Docker (app + infra):

```bash
# Start all services including app
docker compose --profile app up -d

# Check health
curl http://localhost:3000/api/health
```

## 4. Production Deployment on VPS

### 4.1 Server Setup

```bash
# SSH into server
ssh root@103.114.203.44

# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Create app directory
mkdir -p /opt/smsok-clone
cd /opt/smsok-clone

# Copy production files
scp docker-compose.prod.yml root@103.114.203.44:/opt/smsok-clone/
scp .env.production.template root@103.114.203.44:/opt/smsok-clone/.env
scp -r infra/ root@103.114.203.44:/opt/smsok-clone/
```

### 4.2 Configure Environment

```bash
cd /opt/smsok-clone

# Edit .env — replace ALL "CHANGE_ME" values
nano .env

# Generate secrets
openssl rand -hex 32  # For JWT_SECRET, OTP_HASH_SECRET, etc.
openssl rand -hex 16  # For WATCHTOWER_TOKEN
```

### 4.3 Login to GHCR (for private images)

```bash
echo "GITHUB_PAT" | docker login ghcr.io -u lambogreny --password-stdin
```

### 4.4 Start Production Stack

```bash
# Pull latest images and start
docker compose -f docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec app \
  npx prisma migrate deploy

# Seed data (first deploy only)
docker compose -f docker-compose.prod.yml exec app \
  node -e "require('./prisma/seed.js')"

# Verify health
curl http://localhost:3458/api/health
```

### 4.5 SSL + Nginx Setup

```bash
# Install Nginx + Certbot
apt install -y nginx certbot python3-certbot-nginx

# Copy nginx config
cp infra/nginx.conf /etc/nginx/sites-available/smsok
ln -s /etc/nginx/sites-available/smsok /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default

# Replace DOMAIN_PLACEHOLDER with actual domain
sed -i 's/DOMAIN_PLACEHOLDER/smsok.9phum.me/g' /etc/nginx/sites-available/smsok

# Get SSL certificate
certbot --nginx -d smsok.9phum.me

# Test and reload
nginx -t && systemctl reload nginx
```

### 4.6 Setup Daily Backups

```bash
# Copy backup script
cp infra/backup.sh /opt/smsok-clone/
chmod +x /opt/smsok-clone/backup.sh

# Add crontab (daily 3AM)
echo "0 3 * * * /opt/smsok-clone/backup.sh >> /var/log/smsok-backup.log 2>&1" | crontab -

# Test backup manually
/opt/smsok-clone/backup.sh
```

### 4.7 Auto-Deploy via Watchtower

Watchtower is included in `docker-compose.prod.yml` and polls GHCR every 60 seconds. When a new image is pushed (via GitHub Actions on merge to main), Watchtower automatically:

1. Pulls the new image
2. Stops the old container
3. Starts the new container (rolling restart)
4. Cleans up old images

Manual trigger:
```bash
curl -H "Authorization: Bearer YOUR_WATCHTOWER_TOKEN" \
  http://localhost:8080/v1/update
```

## 5. Environment Variables Reference

### Database
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `DB_USER` | Yes | Database username (default: smsok) |
| `DB_PASSWORD` | Yes | Database password |
| `DB_NAME` | Yes | Database name (default: smsok) |

### Redis
| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | Yes | Redis connection string |

### Authentication
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | JWT signing key (min 32 chars, `openssl rand -hex 32`) |
| `OTP_HASH_SECRET` | Yes | OTP hashing key (`openssl rand -hex 32`) |
| `NEXTAUTH_SECRET` | Yes | NextAuth compatibility secret (`openssl rand -hex 32`) |
| `TWO_FA_ENCRYPTION_KEY` | Yes | TOTP secret encryption key (`openssl rand -hex 32`) |
| `CRON_SECRET` | Yes | Cron job authentication (`openssl rand -hex 24`) |
| `OTP_BYPASS_CODE` | No | Leave blank in production |

### Email (SMTP)
| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (587 for TLS) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | Yes | Sender email address |
| `SMTP_SECURE` | No | Use TLS (default: false for STARTTLS) |

### SMS Gateway (EasyThunder)
| Variable | Required | Description |
|----------|----------|-------------|
| `SMS_API_URL` | Yes | SMS API endpoint |
| `SMS_API_USERNAME` | Yes | API username |
| `SMS_API_PASSWORD` | Yes | API password |
| `EASYTHUNDER_API_KEY` | Yes | API key |

### Payment (EasySlip)
| Variable | Required | Description |
|----------|----------|-------------|
| `EASYSLIP_API_KEY` | Yes | EasySlip API key |
| `EASYSLIP_API_URL` | Yes | EasySlip endpoint |

### File Storage (Cloudflare R2)
| Variable | Required | Description |
|----------|----------|-------------|
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 secret key |
| `R2_ENDPOINT` | Yes | R2 endpoint URL |
| `R2_BUCKET_SLIPS` | No | Slip bucket (default: smsok-slips) |
| `R2_BUCKET_DOCS` | No | Docs bucket (default: smsok-docs) |

### App
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Public-facing URL (e.g., https://smsok.9phum.me) |
| `NODE_ENV` | Yes | Must be `production` |

### Auto-Deploy
| Variable | Required | Description |
|----------|----------|-------------|
| `WATCHTOWER_TOKEN` | Yes | HTTP API auth token (`openssl rand -hex 16`) |
| `DOCKER_CONFIG_PATH` | Yes | Path to docker config.json for GHCR auth |
| `WATCHTOWER_NOTIFY_URL` | No | Shoutrrr notification URL (Slack/Discord) |

## 6. Troubleshooting

### App won't start
```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs app --tail 50

# Check health endpoint
curl -v http://localhost:3458/api/health

# Verify database connectivity
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U smsok
```

### Database migration fails
```bash
# Check migration status
docker compose -f docker-compose.prod.yml exec app npx prisma migrate status

# Reset and re-apply (DESTRUCTIVE — dev only)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate reset --force
```

### Redis connection refused
```bash
# Check Redis is running
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
# Expected: PONG

# Check Redis memory
docker compose -f docker-compose.prod.yml exec redis redis-cli info memory
```

### Port conflicts
```bash
# Find process using port 3458
lsof -ti:3458

# Find process using port 5432
lsof -ti:5432
```

### SSL certificate renewal
```bash
# Test renewal
certbot renew --dry-run

# Force renewal
certbot renew --force-renewal
systemctl reload nginx
```

### Container resource issues
```bash
# Check container stats
docker stats --no-stream

# Check container health
docker compose -f docker-compose.prod.yml ps
```

### Backup/Restore
```bash
# Manual backup
/opt/smsok-clone/backup.sh

# Restore from backup
pg_restore --clean --if-exists \
  -h localhost -U smsok -d smsok \
  /opt/smsok-clone/backups/daily/smsok_2026-03-13_0300.dump
```

### Health Check Script
```bash
# Run health dashboard
./scripts/health-check.sh
# Returns JSON with app, postgresql, redis status
# Exit code: 0 = healthy, 1 = unhealthy
```
