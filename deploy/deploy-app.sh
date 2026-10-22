#!/usr/bin/env bash
# 收纳屋 — 在服务器上发布/更新应用
# 用法：把项目放到 /var/www/shounawu/src 后执行本脚本
set -euo pipefail

APP_ROOT=/var/www/shounawu
SRC_ROOT=${1:-$APP_ROOT/src}

if [ ! -d "$SRC_ROOT/apps/api" ] || [ ! -d "$SRC_ROOT/apps/web" ]; then
  echo "找不到项目，请确认路径: $SRC_ROOT/apps/{api,web}"
  exit 1
fi

echo "==> 构建后端"
cd "$SRC_ROOT/apps/api"
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

mkdir -p "$APP_ROOT/api"
rsync -a --delete \
  --exclude node_modules \
  --exclude uploads \
  --exclude prisma/dev.db \
  ./ "$APP_ROOT/api/"

cd "$APP_ROOT/api"
npm install --omit=dev
npx prisma generate

if [ ! -f .env ]; then
  cp "$SRC_ROOT/deploy/env.production.example" .env
  echo "已生成 $APP_ROOT/api/.env ，请务必修改 JWT_SECRET"
fi

mkdir -p uploads
# 保证 DATABASE_URL 指向可写路径
grep -q 'DATABASE_URL=' .env || echo 'DATABASE_URL="file:./prisma/prod.db"' >> .env

echo "==> 构建前端"
cd "$SRC_ROOT/apps/web"
npm install
npm run build:prod
rm -rf "$APP_ROOT/web"/*
cp -a dist/. "$APP_ROOT/web/"

echo "==> 启动/重启 PM2"
cp "$SRC_ROOT/deploy/ecosystem.config.cjs" "$APP_ROOT/ecosystem.config.cjs"
cd "$APP_ROOT"
pm2 startOrReload ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo "==> 完成"
pm2 status
echo "访问: http://gbbzy.fun  或  http://121.40.27.148"
