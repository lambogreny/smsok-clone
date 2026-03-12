# Domain Setup — DNS + Nginx Configuration

## 1. DNS Configuration

Add an A record pointing your domain to the server IP:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | smsok | 103.114.203.44 | 300 |

For subdomain (e.g., `smsok.9phum.me`):
- Go to your DNS provider (Cloudflare, Namecheap, etc.)
- Add A record: `smsok` → `103.114.203.44`
- Wait for DNS propagation (usually 1-5 minutes, max 48 hours)

### Verify DNS

```bash
# Check DNS resolution
dig smsok.9phum.me +short
# Should return: 103.114.203.44

# Or use nslookup
nslookup smsok.9phum.me
```

## 2. Nginx Server Name Configuration

The nginx config at `infra/nginx.conf` uses `DOMAIN_PLACEHOLDER`. Replace it:

```bash
# On the server
sed -i 's/DOMAIN_PLACEHOLDER/smsok.9phum.me/g' /etc/nginx/sites-available/smsok
nginx -t && systemctl reload nginx
```

### Using a Different Domain

If using a custom domain (e.g., `sms.example.com`):

```bash
# Replace with your domain
sed -i 's/DOMAIN_PLACEHOLDER/sms.example.com/g' /etc/nginx/sites-available/smsok

# Update .env
NEXT_PUBLIC_APP_URL="https://sms.example.com"
NEXTAUTH_URL="https://sms.example.com"

# Get SSL cert for new domain
certbot --nginx -d sms.example.com

# Restart app to pick up new env
docker compose -f docker-compose.prod.yml restart app
```

## 3. Port Mapping

| External | Internal | Service |
|----------|----------|---------|
| 80 | - | Nginx (redirects to 443) |
| 443 | - | Nginx (SSL termination) |
| 3458 | 3000 | Next.js app (via Docker) |
| 8080 | 8080 | Watchtower API |

Nginx proxies `443 → 127.0.0.1:3458 → container:3000`.

## 4. Cloudflare (Optional)

If using Cloudflare as DNS proxy:

1. Set SSL/TLS mode to **Full (Strict)**
2. Enable **Always Use HTTPS**
3. Set **Minimum TLS Version** to 1.2
4. Our nginx already handles caching — disable Cloudflare cache or set to "Standard"

## 5. Firewall Setup

```bash
# Allow only necessary ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (certbot + redirect)
ufw allow 443/tcp   # HTTPS
ufw enable

# Verify
ufw status
```

Do NOT expose ports 3458, 5432, 6379, 8080 to the internet.
