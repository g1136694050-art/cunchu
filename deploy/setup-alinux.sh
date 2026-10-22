#!/usr/bin/env bash
# 收纳屋 — Alibaba Cloud Linux / CentOS 首次环境
set -euo pipefail

echo "==> 安装 Nginx / Git / 编译工具"
dnf install -y nginx git gcc-c++ make tar curl

echo "==> 安装 Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
fi
node -v
npm -v

echo "==> 安装 PM2"
npm install -g pm2

echo "==> 创建目录"
mkdir -p /var/www/shounawu/{web,api,uploads,src}

echo "==> 配置 Nginx"
if [ -f /tmp/nginx.gbbzy.fun.conf ]; then
  cp /tmp/nginx.gbbzy.fun.conf /etc/nginx/conf.d/gbbzy.fun.conf
  # 关掉默认欢迎页冲突（若存在）
  if [ -f /etc/nginx/conf.d/default.conf ]; then
    mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true
  fi
  nginx -t
  systemctl enable nginx
  systemctl restart nginx
fi

echo "==> 环境就绪"
node -v
nginx -v
pm2 -v
