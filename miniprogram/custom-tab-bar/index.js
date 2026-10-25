const STANDARD_ACTIONS = [
  { key: 'photo', text: '拍照录入', icon: 'camera', bg: 'linear-gradient(145deg,#7BE0A8,#2FCB6E)' },
  { key: 'scan', text: '扫码录入', icon: 'scan', bg: 'linear-gradient(145deg,#FFD36A,#F5A623)' },
  { key: 'shop', text: '电商录入', icon: 'shop', bg: 'linear-gradient(145deg,#7EC8FF,#3B8CFF)' },
  { key: 'batch', text: '批量录入', icon: 'batch', bg: 'linear-gradient(145deg,#FF9BB8,#F05A7E)' },
  { key: 'stock', text: '扫码出入库', icon: 'stock', bg: 'linear-gradient(145deg,#C9A6FF,#8B5CF6)' },
]

const AI_ACTIONS = [
  { key: 'vision', text: '通用识图', icon: 'vision', bg: 'linear-gradient(145deg,#7BE0A8,#2FCB6E)' },
  { key: 'receipt', text: '小票录入', icon: 'receipt', bg: 'linear-gradient(145deg,#FFD36A,#F5A623)' },
  { key: 'order', text: '订单识别', icon: 'order', bg: 'linear-gradient(145deg,#7EC8FF,#3B8CFF)' },
]

Component({
  data: {
    selected: 0,
    bubbleX: 0,
    bubblePop: false,
    showEntry: false,
    entryMode: 'standard',
    entryActions: STANDARD_ACTIONS,
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: 'home' },
      { pagePath: '/pages/categories/categories', text: '分类', icon: 'grid' },
      { center: true, text: '录入' },
      { pagePath: '/pages/alerts/alerts', text: '提醒', icon: 'bell' },
      { pagePath: '/pages/profile/profile', text: '我的', icon: 'me' },
    ],
  },

  methods: {
    noop() {},

    setSelected(index) {
      const next = Number(index)
      if (Number.isNaN(next) || next === 2) return

      const prev = this.data.selected
      const changed = prev !== next

      this.setData({
        selected: next,
        bubbleX: next * 100,
        bubblePop: changed,
      })

      if (changed) {
        if (this._bubbleTimer) clearTimeout(this._bubbleTimer)
        this._bubbleTimer = setTimeout(() => {
          this.setData({ bubblePop: false })
        }, 520)
      }
    },

    switchTab(e) {
      const { path, index, center } = e.currentTarget.dataset
      if (center) {
        this.openEntry()
        return
      }

      this.setSelected(Number(index))
      wx.switchTab({ url: path })
    },

    openEntry() {
      this.setData({
        showEntry: true,
        entryMode: 'standard',
        entryActions: STANDARD_ACTIONS,
      })
    },

    closeEntry() {
      this.setData({ showEntry: false })
    },

    switchEntryMode(e) {
      const mode = e.currentTarget.dataset.mode
      this.setData({
        entryMode: mode,
        entryActions: mode === 'ai' ? AI_ACTIONS : STANDARD_ACTIONS,
      })
    },

    goForm(query = '') {
      this.closeEntry()
      const qs = query ? `?${query}` : ''
      wx.navigateTo({ url: `/pages/item-form/item-form${qs}` })
    },

    onEntryAction(e) {
      const key = e.currentTarget.dataset.key
      if (key === 'photo' || key === 'vision') {
        this.pickPhotoThenForm(key)
        return
      }
      if (key === 'scan' || key === 'stock') {
        this.scanThenForm(key)
        return
      }
      if (key === 'shop' || key === 'batch') {
        this.goForm(`mode=${key}`)
        return
      }
      // AI 小票 / 订单：先走拍照再进表单
      if (key === 'receipt' || key === 'order') {
        this.pickPhotoThenForm(key)
        return
      }
      wx.showToast({ title: '即将开放', icon: 'none' })
    },

    pickPhotoThenForm(mode) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0]
          if (!file) return
          wx.setStorageSync('pending_item_cover', file.tempFilePath)
          this.goForm(`mode=${mode}`)
        },
        fail: (err) => {
          if (err && /cancel/i.test(err.errMsg || '')) return
          wx.showToast({ title: '未选择图片', icon: 'none' })
        },
      })
    },

    scanThenForm(mode) {
      wx.scanCode({
        onlyFromCamera: false,
        success: (res) => {
          const code = (res && res.result) || ''
          wx.setStorageSync('pending_item_scan', code)
          this.goForm(`mode=${mode}&code=${encodeURIComponent(code)}`)
        },
        fail: (err) => {
          if (err && /cancel/i.test(err.errMsg || '')) return
          wx.showToast({ title: '扫码失败', icon: 'none' })
        },
      })
    },
  },
})
