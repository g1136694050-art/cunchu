const { authApi } = require('../../utils/request')
const { setSession, isLogin } = require('../../utils/auth')

Page({
  data: {
    username: '',
    password: '',
    showPassword: false,
    loading: false,
  },

  onShow() {
    if (isLogin()) {
      wx.switchTab({ url: '/pages/home/home' })
    }
  },

  onUsername(e) {
    this.setData({ username: e.detail.value })
  },

  onPassword(e) {
    this.setData({ password: e.detail.value })
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },

  goRegister() {
    wx.navigateTo({ url: '/pages/register/register' })
  },

  async onSubmit() {
    const username = (this.data.username || '').trim()
    const password = this.data.password || ''
    if (!username || !password) {
      wx.showToast({ title: '请填写账号和密码', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const data = await authApi.login({ username, password })
      setSession(data.accessToken, data.user)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 400)
    } catch (e) {
      /* toast in request */
    } finally {
      this.setData({ loading: false })
    }
  },
})
