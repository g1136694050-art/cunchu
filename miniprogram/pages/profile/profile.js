const { categoryApi } = require('../../utils/request')
const { displayName, ensureDisplayNickname, getUser, clearSession, isLogin } = require('../../utils/auth')

Page({
  data: {
    displayName: '用户',
    username: '-',
    categories: [],
    showAdd: false,
    catName: '',
    catColor: '#7CB342',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(4)
    }
    if (!isLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    ensureDisplayNickname()
    const user = getUser()
    this.setData({
      displayName: displayName(),
      username: (user && user.username) || '-',
    })
    this.loadCats()
  },

  async loadCats() {
    try {
      const cats = await categoryApi.list()
      this.setData({ categories: cats || [] })
    } catch (e) {
      /* handled */
    }
  },

  openAdd() {
    this.setData({ showAdd: true, catName: '', catColor: '#7CB342' })
  },

  closeAdd() {
    this.setData({ showAdd: false })
  },

  onCatName(e) {
    this.setData({ catName: e.detail.value })
  },

  onCatColor(e) {
    this.setData({ catColor: e.detail.value })
  },

  pickPreset(e) {
    this.setData({ catColor: e.currentTarget.dataset.color })
  },

  async confirmAdd() {
    const name = (this.data.catName || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写名称', icon: 'none' })
      return
    }
    try {
      await categoryApi.create({ name, color: this.data.catColor || '#7CB342' })
      wx.showToast({ title: '已添加分类', icon: 'success' })
      this.setData({ showAdd: false })
      this.loadCats()
    } catch (e) {
      /* handled */
    }
  },

  goLocations() {
    wx.navigateTo({ url: '/pages/locations/locations' })
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      success: (res) => {
        if (!res.confirm) return
        clearSession()
        wx.reLaunch({ url: '/pages/login/login' })
      },
    })
  },
})
