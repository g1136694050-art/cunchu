#!/usr/bin/env bash
set -euo pipefail

if [ ! -f /root/.acme.sh/acme.sh ]; then
  curl -fsSL https://get.acme.sh | sh -s email=admin@gbbzy.fun
fi

export PATH="$HOME/.acme.sh:$PATH"

mkdir -p /var/www/shounawu/web/.well-known/acme-challenge

if ! grep -q 'acme-challenge' /etc/nginx/conf.d/gbbzy.fun.conf; then
  sed -i '/client_max_body_size/a\    location ^~ /.well-known/acme-challenge/ { root /var/www/shounawu/web; }' /etc/nginx/conf.d/gbbzy.fun.conf
fi

nginx -t
systemctl reload nginx

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
~/.acme.sh/acme.sh --issue -d gbbzy.fun -d www.gbbzy.fun -w /var/www/shounawu/web --force

CERT_DIR="/root/.acme.sh/gbbzy.fun_ecc"
if [ ! -d "$CERT_DIR" ]; then
  CERT_DIR="/root/.acme.sh/gbbzy.fun"
fi

mkdir -p /etc/nginx/ssl
~/.acme.sh/acme.sh --install-cert -d gbbzy.fun \
  --key-file /etc/nginx/ssl/gbbzy.fun.key \
  --fullchain-file /etc/nginx/ssl/gbbzy.fun.fullchain.cer \
  --reloadcmd "systemctl reload nginx"

cat > /etc/nginx/conf.d/gbbzy.fun.conf <<'EOF'
server {
    listen 80;
    server_name gbbzy.fun www.gbbzy.fun;
    location ^~ /.well-known/acme-challenge/ {
        root /var/www/shounawu/web;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name gbbzy.fun www.gbbzy.fun;

    ssl_certificate     /etc/nginx/ssl/gbbzy.fun.fullchain.cer;
    ssl_certificate_key /etc/nginx/ssl/gbbzy.fun.key;

    client_max_body_size 10m;
    root /var/www/shounawu/web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

nginx -t
systemctl reload nginx

# open 443 if firewalld exists
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active firewalld >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=https || true
  firewall-cmd --reload || true
fi

ss -lntp | grep -E ':80|:443'
curl -s -o /dev/null -w "https:%{http_code}\n" -k https://127.0.0.1/ -H 'Host: gbbzy.fun'
echo "HTTPS ready: https://gbbzy.fun"
echo "若外网仍失败，请在阿里云安全组放行 443 端口"
