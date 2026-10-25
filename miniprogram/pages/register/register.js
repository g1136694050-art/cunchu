const { authApi } = require('../../utils/request')
const { setSession } = require('../../utils/auth')

Page({
  data: {
    username: '',
    nickname: '',
    password: '',
    showPassword: false,
    loading: false,
  },

  onUsername(e) {
    this.setData({ username: e.detail.value })
  },
  onNickname(e) {
    this.setData({ nickname: e.detail.value })
  },
  onPassword(e) {
    this.setData({ password: e.detail.value })
  },
  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword })
  },
  goLogin() {
    wx.navigateBack({ fail: () => wx.redirectTo({ url: '/pages/login/login' }) })
  },

  async onSubmit() {
    const username = (this.data.username || '').trim()
    const password = this.data.password || ''
    const nickname = (this.data.nickname || '').trim()
    if (!username || !password) {
      wx.showToast({ title: '请填写账号和密码', icon: 'none' })
      return
    }
    if (username.length < 3 || password.length < 3) {
      wx.showToast({ title: '账号/密码至少 3 位', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const data = await authApi.register({
        username,
        password,
        nickname: nickname || undefined,
      })
      setSession(data.accessToken, data.user)
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/home/home' })
      }, 400)
    } catch (e) {
      /* handled */
    } finally {
      this.setData({ loading: false })
    }
  },
})
