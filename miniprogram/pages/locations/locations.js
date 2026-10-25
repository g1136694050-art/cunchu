const { locationApi, itemApi } = require('../../utils/request')
const { flattenLocations, formatQty } = require('../../utils/util')

Page({
  data: {
    tree: [],
    expanded: {},
    showAdd: false,
    name: '',
    parentId: '',
    parentName: '无（作为房间）',
    parentRange: ['无（作为房间）'],
    flat: [],
    showItems: false,
    selectedName: '',
    locationItems: [],
  },

  onShow() {
    this.load()
  },

  async load() {
    try {
      const tree = (await locationApi.tree()) || []
      const flat = flattenLocations(tree)
      const expanded = {}
      tree.forEach((t) => {
        expanded[t.id] = true
      })
      this.setData({
        tree,
        flat,
        expanded,
        parentRange: ['无（作为房间）', ...flat.map((l) => l.name)],
      })
    } catch (e) {
      /* handled */
    }
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id
    const key = `expanded.${id}`
    this.setData({ [key]: !this.data.expanded[id] })
  },

  openAdd() {
    this.setData({
      showAdd: true,
      name: '',
      parentId: '',
      parentName: '无（作为房间）',
    })
  },

  closeAdd() {
    this.setData({ showAdd: false })
  },

  onName(e) {
    this.setData({ name: e.detail.value })
  },

  onParentChange(e) {
    const idx = Number(e.detail.value)
    if (idx === 0) {
      this.setData({ parentId: '', parentName: '无（作为房间）' })
      return
    }
    const loc = this.data.flat[idx - 1]
    if (!loc) return
    this.setData({ parentId: loc.id, parentName: loc.name })
  },

  async confirmAdd() {
    const name = (this.data.name || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写名称', icon: 'none' })
      return
    }
    try {
      await locationApi.create({
        name,
        parentId: this.data.parentId || undefined,
      })
      wx.showToast({ title: '已添加位置', icon: 'success' })
      this.setData({ showAdd: false })
      this.load()
    } catch (e) {
      /* handled */
    }
  },

  async openLocation(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    try {
      const res = await itemApi.list({ locationId: id, pageSize: 100 })
      this.setData({
        showItems: true,
        selectedName: name,
        locationItems: (res.list || []).map((it) => ({
          ...it,
          qtyText: `${formatQty(it.quantity)}${it.unit}`,
        })),
      })
    } catch (err) {
      /* handled */
    }
  },

  closeItems() {
    this.setData({ showItems: false })
  },

  openItem(e) {
    this.setData({ showItems: false })
    wx.navigateTo({
      url: `/pages/item-detail/item-detail?id=${e.currentTarget.dataset.id}`,
    })
  },

  removeLocation(e) {
    const id = e.currentTarget.dataset.id
    const name = e.currentTarget.dataset.name
    wx.showModal({
      title: '删除位置',
      content: `删除「${name}」？其中物品将变为未指定位置`,
      success: async (res) => {
        if (!res.confirm) return
        try {
          await locationApi.remove(id)
          wx.showToast({ title: '已删除', icon: 'none' })
          this.setData({ showItems: false })
          this.load()
        } catch (err) {
          /* handled */
        }
      },
    })
  },
})
