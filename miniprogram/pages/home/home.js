const { itemApi, alertApi, resolveUrl } = require('../../utils/request')
const { displayName, ensureDisplayNickname, isLogin } = require('../../utils/auth')
const { enrichItem } = require('../../utils/util')

Page({
  data: {
    keyword: '',
    displayName: '用户',
    avatarUrl: '/images/avatar.jpg',
    items: [],
    featured: [],
    alertText: '',
    actionItem: null,
    showActions: false,
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(0)
    }
    if (!isLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    ensureDisplayNickname()
    this.setData({
      displayName: displayName(),
      avatarUrl: '/images/avatar.jpg',
    })
    this.load()
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh())
  },

  onKeyword(e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearch() {
    this.load()
  },

  onClear() {
    this.setData({ keyword: '' }, () => this.load())
  },

  onScan() {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const code = (res && res.result) || ''
        if (!code) return
        this.setData({ keyword: code }, () => this.load())
      },
      fail: (err) => {
        if (err && /cancel/i.test(err.errMsg || '')) return
        wx.showToast({ title: '扫码失败', icon: 'none' })
      },
    })
  },

  async load() {
    try {
      const [listRes, alertRes] = await Promise.all([
        itemApi.list({
          q: this.data.keyword || undefined,
          pageSize: 100,
        }),
        alertApi.summary(),
      ])
      const items = (listRes.list || []).map((it) => enrichItem(it, resolveUrl))
      const featured = [...items]
        .sort((a, b) => {
          const ap = a.price ?? -1
          const bp = b.price ?? -1
          if (ap !== bp) return bp - ap
          return b.quantity - a.quantity
        })
        .slice(0, 6)

      const parts = []
      if (alertRes.expiringSoonCount) parts.push(`临期 ${alertRes.expiringSoonCount}`)
      if (alertRes.expiredCount) parts.push(`过期 ${alertRes.expiredCount}`)
      if (alertRes.lowStockCount) parts.push(`低库存 ${alertRes.lowStockCount}`)

      this.setData({
        items,
        featured,
        alertText: parts.join(' · '),
      })
    } catch (e) {
      /* handled */
    }
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/profile' })
  },

  goAlerts() {
    wx.switchTab({ url: '/pages/alerts/alerts' })
  },

  openItem(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${id}` })
  },

  openMore(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.items.find((i) => i.id === id)
    if (!item) return
    this.setData({ actionItem: item, showActions: true })
  },

  closeActions() {
    this.setData({ showActions: false })
  },

  async onAction(e) {
    const action = e.currentTarget.dataset.action
    const item = this.data.actionItem
    if (!item) return

    if (action === 'plus' || action === 'minus') {
      const delta = action === 'plus' ? 1 : -1
      try {
        await itemApi.stock(item.id, {
          delta,
          reason: delta > 0 ? 'purchase' : 'use',
        })
        wx.showToast({ title: delta > 0 ? '已入库 +1' : '已出库 -1', icon: 'success' })
        this.setData({ showActions: false })
        this.load()
      } catch (err) {
        /* handled */
      }
      return
    }

    if (action === 'detail') {
      this.setData({ showActions: false })
      wx.navigateTo({ url: `/pages/item-detail/item-detail?id=${item.id}` })
      return
    }

    if (action === 'edit') {
      this.setData({ showActions: false })
      wx.navigateTo({ url: `/pages/item-form/item-form?id=${item.id}` })
      return
    }

    if (action === 'delete') {
      wx.showModal({
        title: '删除物品',
        content: `确定删除「${item.name}」？`,
        success: async (res) => {
          if (!res.confirm) return
          try {
            await itemApi.remove(item.id)
            wx.showToast({ title: '已删除', icon: 'none' })
            this.setData({ showActions: false })
            this.load()
          } catch (err) {
            /* handled */
          }
        },
      })
    }
  },
})
