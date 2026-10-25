const { alertApi } = require('../../utils/request')
const { isLogin } = require('../../utils/auth')
const { formatDate, formatQty } = require('../../utils/util')

Page({
  data: {
    expiringSoon: [],
    expired: [],
    lowStock: [],
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(3)
    }
    if (!isLogin()) {
      wx.reLaunch({ url: '/pages/login/login' })
      return
    }
    this.load()
  },

  onPullDownRefresh() {
    this.load().finally(() => wx.stopPullDownRefresh())
  },

  async load() {
    try {
      const data = await alertApi.summary()
      const mapItems = (list) =>
        (list || []).map((it) => ({
          ...it,
          expireText: formatDate(it.expireAt),
          qtyText: `${formatQty(it.quantity)}${it.unit}`,
        }))
      this.setData({
        expiringSoon: mapItems(data.expiringSoon),
        expired: mapItems(data.expired),
        lowStock: (data.lowStock || []).map((it) => ({
          ...it,
          label: `阈值 ${it.lowStockThreshold}`,
          qtyText: `${formatQty(it.quantity)}${it.unit}`,
        })),
      })
    } catch (e) {
      /* handled */
    }
  },

  openItem(e) {
    wx.navigateTo({
      url: `/pages/item-detail/item-detail?id=${e.currentTarget.dataset.id}`,
    })
  },
})
