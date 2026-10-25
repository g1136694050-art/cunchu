const { isLogin } = require('./utils/auth')

App({
  onLaunch() {
    // 冷启动时未登录则进登录页（首页是 tab，由各页自行校验也可）
    if (!isLogin()) {
      // 延迟到首屏后，避免与 tab 冲突；login 页也会再拦一次
    }
  },
  globalData: {
    version: '1.0.0',
  },
})
