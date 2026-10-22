#!/usr/bin/env bash
# 收纳屋 — Ubuntu 首次环境安装（在服务器上以 root 执行）
set -euo pipefail

echo "==> 更新系统"
apt-get update -y
apt-get install -y nginx curl git build-essential

echo "==> 安装 Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "==> 安装 PM2"
npm install -g pm2

echo "==> 创建目录"
mkdir -p /var/www/shounawu/{web,api,uploads}
chown -R www-data:www-data /var/www/shounawu || true

echo "==> 配置 Nginx"
if [ -f /tmp/nginx.gbbzy.fun.conf ]; then
  cp /tmp/nginx.gbbzy.fun.conf /etc/nginx/sites-available/gbbzy.fun
  ln -sfn /etc/nginx/sites-available/gbbzy.fun /etc/nginx/sites-enabled/gbbzy.fun
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl reload nginx
fi

echo "==> 完成。请继续执行 deploy-app.sh 发布代码"
node -v
nginx -v
pm2 -v
