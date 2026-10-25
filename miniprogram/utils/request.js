/**
 * API 适配层：全部走本地 db，无网络请求。
 * 保持与各页面原有 authApi / itemApi 等调用方式兼容。
 */
const db = require('./db')

function wrap(fn) {
  return (...args) => {
    try {
      const result = fn(...args)
      if (result && typeof result.then === 'function') {
        return result.catch((err) => {
          const message = (err && err.message) || '操作失败'
          wx.showToast({ title: String(message), icon: 'none' })
          return Promise.reject(err)
        })
      }
      return Promise.resolve(result)
    } catch (err) {
      const message = (err && err.message) || '操作失败'
      if (err && err.code === 401) {
        wx.removeStorageSync('token')
        wx.removeStorageSync('user')
        const pages = getCurrentPages()
        const cur = pages[pages.length - 1]
        const route = cur ? `/${cur.route}` : ''
        if (!route.includes('login')) {
          wx.reLaunch({ url: '/pages/login/login' })
        }
      } else {
        wx.showToast({ title: String(message), icon: 'none' })
      }
      return Promise.reject(err)
    }
  }
}

function resolveUrl(path) {
  // 本地路径 / 已是完整路径，原样返回
  return path || ''
}

function uploadImage(filePath) {
  return db.saveLocalImage(filePath).catch((err) => {
    wx.showToast({ title: '保存图片失败', icon: 'none' })
    return Promise.reject(err)
  })
}

module.exports = {
  resolveUrl,
  uploadImage,
  authApi: {
    login: wrap(db.login),
    register: wrap(db.register),
    me: wrap(() => {
      const user = wx.getStorageSync('user')
      if (!user) throw { message: '未登录', code: 401 }
      return user
    }),
  },
  categoryApi: {
    list: wrap(db.listCategories),
    create: wrap(db.createCategory),
    update: wrap(db.updateCategory),
    remove: wrap(db.removeCategory),
  },
  locationApi: {
    tree: wrap(db.locationTree),
    create: wrap(db.createLocation),
    update: wrap(db.updateLocation),
    remove: wrap(db.removeLocation),
  },
  itemApi: {
    list: wrap(db.listItems),
    detail: wrap(db.itemDetail),
    create: wrap(db.createItem),
    update: wrap(db.updateItem),
    remove: wrap(db.removeItem),
    stock: wrap(db.changeStock),
    logs: wrap(db.itemLogs),
  },
  alertApi: {
    summary: wrap(db.alertSummary),
  },
}
