#!/usr/bin/env bash
set -euo pipefail

cd /var/www/shounawu/api

SECRET=$(openssl rand -hex 32 || head -c 32 /dev/urandom | xxd -p)
cat > .env <<EOF
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="${SECRET}"
JWT_EXPIRES_IN="7d"
PORT=3000
UPLOAD_DIR="uploads"
NODE_ENV="production"
EOF

mkdir -p uploads prisma
cp -a /var/www/shounawu/src/apps/api/prisma/migrations prisma/
cp /var/www/shounawu/src/apps/api/prisma/schema.prisma prisma/schema.prisma
npx prisma migrate deploy
npx prisma generate

cp /var/www/shounawu/src/deploy/ecosystem.config.cjs /var/www/shounawu/ecosystem.config.cjs

if command -v firewall-cmd >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --permanent --add-service=https || true
  firewall-cmd --reload || true
fi
setsebool -P httpd_can_network_connect 1 2>/dev/null || true

systemctl enable nginx
systemctl restart nginx

cd /var/www/shounawu
pm2 delete shounawu-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

sleep 2
pm2 status
echo -n "web:"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/
echo -n "api:"
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1/api/v1/me
ls -la /var/www/shounawu/web/index.html
echo "DONE http://gbbzy.fun  http://121.40.27.148"
