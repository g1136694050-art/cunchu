const { categoryApi, itemApi, resolveUrl } = require('../../utils/request')
const { isLogin } = require('../../utils/auth')
const { enrichItem } = require('../../utils/util')

Page({
  data: {
    categories: [],
    items: [],
    filtered: [],
    activeId: '',
    activeName: '全部物品',
    showAdd: false,
    catName: '',
    catColor: '#2f6bff',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setSelected(1)
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
      const [cats, listRes] = await Promise.all([
        categoryApi.list(),
        itemApi.list({ pageSize: 200 }),
      ])
      const categories = (cats || []).map((c) => ({
        ...c,
        count: (listRes.list || []).filter((i) => i.categoryId === c.id).length,
      }))
      const items = (listRes.list || []).map((it) => enrichItem(it, resolveUrl))
      this.setData({ categories, items }, () => this.applyFilter())
    } catch (e) {
      /* handled */
    }
  },

  applyFilter() {
    const { activeId, items, categories } = this.data
    const filtered = activeId
      ? items.filter((i) => i.categoryId === activeId)
      : items
    const activeName = activeId
      ? (categories.find((c) => c.id === activeId) || {}).name || '分类'
      : '全部物品'
    this.setData({ filtered, activeName })
  },

  selectAll() {
    this.setData({ activeId: '' }, () => this.applyFilter())
  },

  selectCat(e) {
    this.setData({ activeId: e.currentTarget.dataset.id }, () => this.applyFilter())
  },

  openAdd() {
    this.setData({ showAdd: true, catName: '', catColor: '#2f6bff' })
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
      await categoryApi.create({ name, color: this.data.catColor || '#2f6bff' })
      wx.showToast({ title: '已添加分类', icon: 'success' })
      this.setData({ showAdd: false })
      this.load()
    } catch (e) {
      /* handled */
    }
  },

  longPressCat(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '删除分类',
      content: `确定删除「${name}」？分类下不能有物品`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await categoryApi.remove(id)
          wx.showToast({ title: '已删除', icon: 'none' })
          if (this.data.activeId === id) {
            this.setData({ activeId: '' })
          }
          this.load()
        } catch (err) {
          /* handled */
        }
      },
    })
  },

  openItem(e) {
    wx.navigateTo({
      url: `/pages/item-detail/item-detail?id=${e.currentTarget.dataset.id}`,
    })
  },
})
