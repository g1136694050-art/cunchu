const {
  categoryApi,
  itemApi,
  locationApi,
  uploadImage,
  resolveUrl,
} = require('../../utils/request')
const { flattenLocations } = require('../../utils/util')

Page({
  data: {
    id: '',
    isEdit: false,
    loading: false,
    categories: [],
    flatLocations: [],
    coverPreview: '',
    form: {
      name: '',
      categoryId: '',
      categoryName: '',
      locationId: '',
      locationName: '',
      quantity: '1',
      unit: '个',
      price: '',
      lowStockThreshold: '',
      expireAt: '',
      spec: '',
      remark: '',
      coverUrl: '',
    },
    showCatPicker: false,
    showLocPicker: false,
    catRange: [],
    locRange: [],
  },

  onLoad(query) {
    const id = query.id || ''
    const isEdit = !!id
    const mode = query.mode || ''
    const scanCode = query.code ? decodeURIComponent(query.code) : ''
    this.setData({ id, isEdit, entryMode: mode })
    wx.setNavigationBarTitle({ title: isEdit ? '编辑物品' : '添加物品' })
    this.bootstrap(scanCode)
  },

  async bootstrap(scanCode) {
    try {
      await this.loadMeta()
      if (this.data.isEdit) {
        await this.loadItem()
        return
      }
      await this.applyPendingEntry(scanCode)
    } catch (e) {
      /* handled */
    }
  },

  async applyPendingEntry(scanCode) {
    const patch = {}
    const code = scanCode || wx.getStorageSync('pending_item_scan') || ''
    if (code) {
      patch['form.name'] = code
      patch['form.spec'] = code
      wx.removeStorageSync('pending_item_scan')
    }

    const pendingCover = wx.getStorageSync('pending_item_cover') || ''
    if (pendingCover) {
      wx.removeStorageSync('pending_item_cover')
      try {
        wx.showLoading({ title: '保存图片' })
        const data = await uploadImage(pendingCover)
        patch.coverPreview = data.url
        patch['form.coverUrl'] = data.url
      } catch (e) {
        /* handled */
      } finally {
        wx.hideLoading()
      }
    }

    if (Object.keys(patch).length) this.setData(patch)
  },

  async loadMeta() {
    const [cats, locs] = await Promise.all([categoryApi.list(), locationApi.tree()])
    const categories = Array.isArray(cats) ? cats : []
    const flatLocations = flattenLocations(Array.isArray(locs) ? locs : [])
    const patch = {
      categories,
      flatLocations,
      catRange: categories.map((c) => c.name),
      locRange: ['不指定', ...flatLocations.map((l) => l.name)],
    }
    if (!this.data.isEdit && categories.length && !this.data.form.categoryId) {
      patch.form = {
        ...this.data.form,
        categoryId: categories[0].id,
        categoryName: categories[0].name,
      }
    }
    this.setData(patch)
  },

  async loadItem() {
    const item = await itemApi.detail(this.data.id)
    this.setData({
      coverPreview: item.coverUrl ? resolveUrl(item.coverUrl) : '',
      form: {
        name: item.name || '',
        categoryId: item.categoryId || '',
        categoryName: (item.category && item.category.name) || '',
        locationId: item.locationId || '',
        locationName: (item.location && item.location.name) || '',
        quantity: String(item.quantity ?? 1),
        unit: item.unit || '个',
        price: item.price == null ? '' : String(item.price),
        lowStockThreshold:
          item.lowStockThreshold == null ? '' : String(item.lowStockThreshold),
        expireAt: item.expireAt ? String(item.expireAt).slice(0, 10) : '',
        spec: item.spec || '',
        remark: item.remark || '',
        coverUrl: item.coverUrl || '',
      },
    })
  },

  setField(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ [`form.${key}`]: e.detail.value })
  },

  chooseCover() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0]
        if (!file) return
        try {
          wx.showLoading({ title: '保存中' })
          const data = await uploadImage(file.tempFilePath)
          this.setData({
            coverPreview: data.url,
            'form.coverUrl': data.url,
          })
        } catch (e) {
          /* handled */
        } finally {
          wx.hideLoading()
        }
      },
    })
  },

  openCatPicker() {
    this.setData({ showCatPicker: true })
  },

  openLocPicker() {
    this.setData({ showLocPicker: true })
  },

  closePickers() {
    this.setData({ showCatPicker: false, showLocPicker: false })
  },

  onCatChange(e) {
    const idx = Number(e.detail.value)
    const cat = this.data.categories[idx]
    if (!cat) return
    this.setData({
      'form.categoryId': cat.id,
      'form.categoryName': cat.name,
      showCatPicker: false,
    })
  },

  onLocChange(e) {
    const idx = Number(e.detail.value)
    if (idx === 0) {
      this.setData({
        'form.locationId': '',
        'form.locationName': '',
        showLocPicker: false,
      })
      return
    }
    const loc = this.data.flatLocations[idx - 1]
    if (!loc) return
    this.setData({
      'form.locationId': loc.id,
      'form.locationName': loc.name,
      showLocPicker: false,
    })
  },

  onExpireChange(e) {
    this.setData({ 'form.expireAt': e.detail.value })
  },

  async onSubmit() {
    const form = this.data.form
    if (!form.name || !form.categoryId) {
      wx.showToast({ title: '请填写名称和分类', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        locationId: form.locationId || undefined,
        quantity: Number(form.quantity) || 0,
        unit: form.unit || '个',
        price:
          form.price === '' || form.price == null || Number.isNaN(Number(form.price))
            ? undefined
            : Number(form.price),
        lowStockThreshold:
          form.lowStockThreshold === '' || form.lowStockThreshold == null
            ? undefined
            : Number(form.lowStockThreshold),
        expireAt: form.expireAt || undefined,
        spec: form.spec || undefined,
        remark: form.remark || undefined,
        coverUrl: form.coverUrl || undefined,
      }
      if (this.data.isEdit) {
        await itemApi.update(this.data.id, payload)
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/item-detail/item-detail?id=${this.data.id}` })
        }, 400)
      } else {
        const created = await itemApi.create(payload)
        wx.showToast({ title: '已添加', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/item-detail/item-detail?id=${created.id}` })
        }, 400)
      }
    } catch (e) {
      /* handled */
    } finally {
      this.setData({ loading: false })
    }
  },
})
