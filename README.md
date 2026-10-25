# 收纳屋（微信小程序）

家庭储物库存管理小程序。数据全部保存在手机本地，**无需服务器、无需配置合法域名**。

## 打开方式

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本仓库根目录（`miniprogramRoot` 已指向 `miniprogram/`）
3. AppID：`wx86e8818565082c2f`（也可用测试号）
4. 编译后即可在模拟器 / 真机预览使用

## 功能

- 账号密码注册 / 登录（本地账号）
- 首页精选卡片 + 物品列表，搜索、快速 ±1
- 底部 Tab：首页 / 分类 / **+ 录入** / 提醒 / 我的
- 分类色板、两级位置、保质期 / 低库存提醒
- 拍照 / 相册封面（存本机）

## 目录

```
miniprogram/          小程序源码
project.config.json   微信工程配置
```

## 说明

数据存在 `wx.storage`，清除小程序缓存会丢失本地数据。换机不同步。
