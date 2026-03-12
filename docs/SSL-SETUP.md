# SSL Setup — Let's Encrypt + Certbot

## Prerequisites

- Domain pointing to your server IP (A record configured)
- Nginx installed and running
- Port 80 and 443 open in firewall

## Initial Certificate Setup

```bash
# 1. Install Certbot
apt update && apt install -y certbot python3-certbot-nginx

# 2. Ensure nginx config is in place
cp infra/nginx.conf /etc/nginx/sites-available/smsok
ln -sf /etc/nginx/sites-available/smsok /etc/nginx/sites-enabled/smsok
rm -f /etc/nginx/sites-enabled/default

# 3. Replace DOMAIN_PLACEHOLDER with your domain
sed -i 's/DOMAIN_PLACEHOLDER/smsok.9phum.me/g' /etc/nginx/sites-available/smsok

# 4. Create ACME challenge directory
mkdir -p /var/www/certbot

# 5. Test nginx config (should pass even without certs — comment out SSL lines first)
nginx -t

# 6. Get certificate (Certbot auto-configures nginx)
certbot --nginx -d smsok.9phum.me --non-interactive --agree-tos -m admin@9phum.me

# 7. Verify
nginx -t && systemctl reload nginx
curl -I https://smsok.9phum.me
```

## Certificate Auto-Renewal

Certbot installs a systemd timer by default. Verify:

```bash
# Check timer is active
systemctl status certbot.timer

# Test renewal (dry run)
certbot renew --dry-run
```

For additional safety, use our custom renewal script:

```bash
# Install auto-renew script
cp infra/certbot-renew.sh /opt/smsok-clone/
chmod +x /opt/smsok-clone/certbot-renew.sh

# Add crontab (twice daily — certbot only renews if <30 days left)
echo "0 3,15 * * * /opt/smsok-clone/certbot-renew.sh >> /var/log/smsok-certbot.log 2>&1" | crontab -l | crontab -
```

## SSL Configuration Details

Our nginx.conf includes enterprise-grade SSL:

| Setting | Value | Why |
|---------|-------|-----|
| Protocols | TLS 1.2 + 1.3 | No legacy (TLS 1.0/1.1 disabled) |
| Ciphers | ECDHE + AES-GCM | Forward secrecy, authenticated encryption |
| Session cache | shared:SSL:10m | Reduces handshake overhead |
| Session tickets | off | Better forward secrecy |
| OCSP stapling | on | Faster certificate validation |
| HSTS | 2 years + preload | Forces HTTPS, browser-cached |

## Verify SSL Grade

After setup, test at:
- https://www.ssllabs.com/ssltest/analyze.html?d=smsok.9phum.me
- Expected grade: **A+** (with HSTS preload)

## Troubleshooting

### Certificate not found
```bash
# List certificates
certbot certificates

# Certificate location
ls -la /etc/letsencrypt/live/smsok.9phum.me/
```

### Renewal fails
```bash
# Check port 80 is open
curl -I http://smsok.9phum.me/.well-known/acme-challenge/test

# Check firewall
ufw status
ufw allow 80
ufw allow 443
```

### Mixed content warnings
Ensure `NEXT_PUBLIC_APP_URL` in .env starts with `https://`.
