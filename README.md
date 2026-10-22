# 收纳屋

家庭储物库存管理 H5（Vue3 + Vite + PWA + NestJS）。一眼看清家里还有多少，支持位置、数量、保质期、拍照与账号登录。

## 本地启动

需要 Node.js 18+。在项目根目录执行：

```bash
# 首次：安装根目录 + 前后端依赖，并初始化数据库
npm install
npm run install:all
npm run db:migrate

# 日常开发：一条命令同时启动前后端
npm run dev
```

| 服务 | 地址 |
|------|------|
| H5 前端 | http://localhost:5173 |
| API | http://localhost:3000/api/v1 |

用手机访问时，浏览器打开本机局域网 IP（如 `http://192.168.x.x:5173`）；前端已把 `/api`、`/uploads` 代理到后端。

也可单独启动：

```bash
npm run dev:api   # 仅后端
npm run dev:web   # 仅前端
```

## 功能（MVP）

- 账号密码注册 / 登录
- 首页双列色块存量卡片（对标「我的存量」）
- 搜索、快速 ±1、物品详情与出入库流水
- 分类色板、两级位置、保质期 / 低库存提醒
- 拍照 / 相册上传封面
- PWA 可安装到主屏幕

## 目录

```
apps/web   Vue3 H5
apps/api   NestJS + Prisma + SQLite
docs/      产品设计方案
```

## 演示建议

1. 打开前端 → 注册账号  
2. 「位置」新增：主卧 → 衣柜  
3. 「+」添加「NB 纸尿裤」，分类选母婴，数量 468  
4. 首页出现绿色大数字卡片；点 `···` 可 ±1  

更完整的设计说明见 [`docs/产品设计方案.md`](docs/产品设计方案.md)。
