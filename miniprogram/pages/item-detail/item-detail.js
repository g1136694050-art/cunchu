const { itemApi, resolveUrl } = require('../../utils/request')
const { formatDate, formatDateTime, formatQty, formatPrice } = require('../../utils/util')

Page({
  data: {
    id: '',
    item: null,
    logs: [],
  },

  onLoad(query) {
    this.setData({ id: query.id || '' })
  },

  onShow() {
    if (this.data.id) this.load()
  },

  async load() {
    const id = this.data.id
    try {
      const [item, logs] = await Promise.all([itemApi.detail(id), itemApi.logs(id)])
      const color = (item.category && item.category.color) || '#5D4037'
      this.setData({
        item: {
          ...item,
          coverUrl: item.coverUrl ? resolveUrl(item.coverUrl) : '',
          categoryColor: color,
          categoryName: (item.category && item.category.name) || '-',
          locationName: (item.location && item.location.name) || '未指定',
          qtyText: formatQty(item.quantity),
          priceText: formatPrice(item.price),
          expireText: formatDate(item.expireAt),
          lowStockText:
            item.lowStockThreshold == null ? '未设置' : String(item.lowStockThreshold),
        },
        logs: (logs || []).map((log) => ({
          ...log,
          title: `${log.delta > 0 ? '+' : ''}${log.delta} → ${log.quantityAfter}`,
          label: `${log.reason}${log.note ? ' · ' + log.note : ''}`,
          time: formatDateTime(log.createdAt),
        })),
      })
    } catch (e) {
      /* handled */
    }
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/item-form/item-form?id=${this.data.id}` })
  },

  async changeQty(e) {
    const delta = Number(e.currentTarget.dataset.delta)
    try {
      await itemApi.stock(this.data.id, {
        delta,
        reason: delta > 0 ? 'purchase' : 'use',
      })
      wx.showToast({ title: delta > 0 ? '+1' : '-1', icon: 'success' })
      this.load()
    } catch (err) {
      /* handled */
    }
  },

  removeItem() {
    const item = this.data.item
    if (!item) return
    wx.showModal({
      title: '删除物品',
      content: `确定删除「${item.name}」？`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await itemApi.remove(item.id)
          wx.showToast({ title: '已删除', icon: 'none' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/home/home' })
          }, 400)
        } catch (err) {
          /* handled */
        }
      },
    })
  },
})
