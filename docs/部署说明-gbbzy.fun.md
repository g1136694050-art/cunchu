# 收纳屋部署到 gbbzy.fun

## 已确认信息

| 项 | 值 |
|----|-----|
| 域名 | `gbbzy.fun` |
| 公网 IP | `121.40.27.148` |
| 系统 | Ubuntu |
| 配置 | 2 核 / 2 GiB / 3 Mbps |
| 架构 | Nginx（静态+反代）+ NestJS（PM2）+ SQLite |

## 你还需要准备

1. **DNS**：`gbbzy.fun` / `www` 的 A 记录指向 `121.40.27.148`
2. **安全组放行**：`22`、`80`（建议再放 `443`）
3. **SSH 登录**：用户名（多为 `root`）+ 密码或密钥  
   （不要把密码发到聊天里，本机登录即可）

## 一、本机连上服务器

### 方式 A：普通 SSH（推荐）

```powershell
ssh root@121.40.27.148
```

### 方式 B：Workbench CLI

```powershell
irm https://workbench-cli.oss-cn-hangzhou.aliyuncs.com/install.ps1 | iex
```

装好后按阿里云文档用实例 ID `i-bp1aimhd2i9jjuxengry` 连接，效果同样是拿到一台 Linux shell。

## 二、上传代码

在**本机项目根目录**（有 `apps/`、`deploy/` 的那一层）执行：

```powershell
scp -r apps deploy docs root@121.40.27.148:/var/www/shounawu/src/
```

若服务器还没有目录，先 SSH 上去执行：

```bash
mkdir -p /var/www/shounawu/src
```

## 三、服务器首次环境

SSH 登录后：

```bash
# 拷贝脚本到可执行位置
cp /var/www/shounawu/src/deploy/nginx.gbbzy.fun.conf /tmp/
cp /var/www/shounawu/src/deploy/setup-ubuntu.sh /tmp/
chmod +x /tmp/setup-ubuntu.sh /var/www/shounawu/src/deploy/*.sh
bash /tmp/setup-ubuntu.sh
```

## 四、发布应用

```bash
bash /var/www/shounawu/src/deploy/deploy-app.sh /var/www/shounawu/src
```

首次会生成 `/var/www/shounawu/api/.env`，请立刻改掉 `JWT_SECRET`：

```bash
nano /var/www/shounawu/api/.env
pm2 restart shounawu-api
```

## 五、（可选）HTTPS

DNS 生效且 80 能访问后：

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d gbbzy.fun -d www.gbbzy.fun
```

## 六、验证

- 浏览器打开：http://gbbzy.fun 或 http://121.40.27.148  
- 注册账号 → 添加带价格的物品 → 看存量页  
- 服务状态：`pm2 status` / `systemctl status nginx`

## 更新版本

本机改完代码后重新 `scp`，再在服务器执行：

```bash
bash /var/www/shounawu/src/deploy/deploy-app.sh /var/www/shounawu/src
```

## 常见问题

| 现象 | 处理 |
|------|------|
| 域名打不开 | 查 DNS 是否指向 121.40.27.148；安全组是否放行 80 |
| 页面开了但接口 502 | `pm2 logs shounawu-api`；确认 3000 被 Nginx 反代 |
| 上传失败 | 看 `/var/www/shounawu/api/uploads` 权限；Nginx `client_max_body_size` |
| SSH 连不上 | 安全组放行 22；控制台「远程连接」先进去再改 sshd |
