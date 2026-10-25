/**
 * 纯本地数据层：全部存在 wx.storage，不发起任何网络请求。
 */

const STORE_KEY = 'shounawu_db_v1'

const DEFAULT_CATEGORIES = [
  { id: 'cat_baby', name: '母婴', color: '#7CB342', sort: 0, isSystem: true },
  { id: 'cat_food', name: '食品', color: '#EF5350', sort: 1, isSystem: true },
  { id: 'cat_daily', name: '日用', color: '#2f6bff', sort: 2, isSystem: true },
  { id: 'cat_cloth', name: '衣物', color: '#AB47BC', sort: 3, isSystem: true },
  { id: 'cat_other', name: '其它', color: '#90A4AE', sort: 4, isSystem: true },
]

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function emptyDb() {
  return {
    users: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    locations: [],
    items: [],
    logs: [],
  }
}

function readDb() {
  try {
    const raw = wx.getStorageSync(STORE_KEY)
    if (!raw) {
      const db = emptyDb()
      writeDb(db)
      return db
    }
    const db = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!db.categories || !db.categories.length) {
      db.categories = DEFAULT_CATEGORIES.map((c) => ({ ...c }))
    }
    db.users = db.users || []
    db.locations = db.locations || []
    db.items = db.items || []
    db.logs = db.logs || []
    return db
  } catch (e) {
    const db = emptyDb()
    writeDb(db)
    return db
  }
}

function writeDb(db) {
  wx.setStorageSync(STORE_KEY, db)
}

function withDb(mutator) {
  const db = readDb()
  const result = mutator(db)
  writeDb(db)
  return result
}

function requireUserId() {
  const user = wx.getStorageSync('user')
  if (!user || !user.id) {
    const err = { message: '未登录', code: 401 }
    throw err
  }
  return user.id
}

function daysFromNow(iso) {
  if (!iso) return null
  const t = new Date(String(iso).slice(0, 10) + 'T00:00:00').getTime()
  if (Number.isNaN(t)) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((t - today.getTime()) / 86400000)
}

function decorateItem(item, db) {
  const category = db.categories.find((c) => c.id === item.categoryId) || null
  const location = item.locationId
    ? db.locations.find((l) => l.id === item.locationId) || null
    : null
  const dayDiff = daysFromNow(item.expireAt)
  const isExpired = dayDiff != null && dayDiff < 0
  const isExpiringSoon = dayDiff != null && dayDiff >= 0 && dayDiff <= 7
  const isLowStock =
    item.lowStockThreshold != null &&
    item.lowStockThreshold !== '' &&
    Number(item.quantity) <= Number(item.lowStockThreshold)

  return {
    ...item,
    category: category
      ? { id: category.id, name: category.name, color: category.color }
      : null,
    location: location
      ? { id: location.id, name: location.name, parentId: location.parentId || null }
      : null,
    isExpired,
    isExpiringSoon,
    isLowStock,
  }
}

function buildLocationTree(locations, items) {
  const nodes = locations.map((l) => ({
    ...l,
    itemCount: items.filter((i) => i.locationId === l.id).length,
    children: [],
  }))
  const map = {}
  nodes.forEach((n) => {
    map[n.id] = n
  })
  const roots = []
  nodes.forEach((n) => {
    if (n.parentId && map[n.parentId]) {
      map[n.parentId].children.push(n)
    } else {
      roots.push(n)
    }
  })
  return roots
}

// —— Auth ——
function register({ username, password, nickname }) {
  return withDb((db) => {
    const name = String(username || '').trim()
    if (name.length < 3 || String(password || '').length < 3) {
      throw { message: '账号/密码至少 3 位' }
    }
    if (db.users.some((u) => u.username === name)) {
      throw { message: '账号已存在' }
    }
    const user = {
      id: uid('user'),
      username: name,
      password: String(password),
      nickname: nickname ? String(nickname).trim() : null,
    }
    db.users.push(user)
    return {
      accessToken: `local_${user.id}`,
      user: { id: user.id, username: user.username, nickname: user.nickname },
    }
  })
}

function login({ username, password }) {
  return withDb((db) => {
    const name = String(username || '').trim()
    const user = db.users.find(
      (u) => u.username === name && u.password === String(password || ''),
    )
    if (!user) throw { message: '账号或密码错误' }
    // 数字账号没有昵称时，补上文字昵称
    if (!user.nickname || /^\d+$/.test(String(user.nickname).trim())) {
      user.nickname = /^\d+$/.test(name) ? '收纳用户' : name
    }
    return {
      accessToken: `local_${user.id}`,
      user: { id: user.id, username: user.username, nickname: user.nickname },
    }
  })
}

// —— Categories ——
function listCategories() {
  const userId = requireUserId()
  const db = readDb()
  return db.categories
    .filter((c) => !c.userId || c.userId === userId)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
}

function createCategory({ name, color }) {
  const userId = requireUserId()
  return withDb((db) => {
    const cat = {
      id: uid('cat'),
      userId,
      name: String(name).trim(),
      color: color || '#2f6bff',
      sort: db.categories.length,
      isSystem: false,
    }
    db.categories.push(cat)
    return cat
  })
}

function updateCategory(id, data) {
  requireUserId()
  return withDb((db) => {
    const cat = db.categories.find((c) => c.id === id)
    if (!cat) throw { message: '分类不存在' }
    if (data.name != null) cat.name = String(data.name).trim()
    if (data.color != null) cat.color = data.color
    return cat
  })
}

function removeCategory(id) {
  const userId = requireUserId()
  return withDb((db) => {
    const used = db.items.some((i) => i.userId === userId && i.categoryId === id)
    if (used) throw { message: '分类下还有物品，无法删除' }
    const cat = db.categories.find((c) => c.id === id)
    if (cat && cat.isSystem) throw { message: '系统分类不可删除' }
    db.categories = db.categories.filter((c) => c.id !== id)
    return true
  })
}

// —— Locations ——
function locationTree() {
  const userId = requireUserId()
  ensureDemoData(userId)
  const db = readDb()
  const locs = db.locations.filter((l) => l.userId === userId)
  const items = db.items.filter((i) => i.userId === userId)
  return buildLocationTree(locs, items)
}

function createLocation({ name, parentId }) {
  const userId = requireUserId()
  return withDb((db) => {
    const loc = {
      id: uid('loc'),
      userId,
      name: String(name).trim(),
      parentId: parentId || null,
    }
    db.locations.push(loc)
    return loc
  })
}

function updateLocation(id, data) {
  const userId = requireUserId()
  return withDb((db) => {
    const loc = db.locations.find((l) => l.id === id && l.userId === userId)
    if (!loc) throw { message: '位置不存在' }
    if (data.name != null) loc.name = String(data.name).trim()
    if (data.parentId !== undefined) loc.parentId = data.parentId || null
    return loc
  })
}

function removeLocation(id) {
  const userId = requireUserId()
  return withDb((db) => {
    const ids = new Set([id])
    db.locations
      .filter((l) => l.userId === userId && l.parentId === id)
      .forEach((l) => ids.add(l.id))
    db.locations = db.locations.filter((l) => !ids.has(l.id))
    db.items.forEach((it) => {
      if (it.userId === userId && ids.has(it.locationId)) {
        it.locationId = null
      }
    })
    return true
  })
}

/** 当前用户无物品时，写入 10 条带白底图的模拟数据 */
function ensureDemoData(userId) {
  return withDb((db) => {
    if (db.items.some((i) => i.userId === userId)) return false

    const now = new Date().toISOString()
    const day = (offset) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() + offset)
      return d.toISOString().slice(0, 10)
    }

    const locFridge = { id: uid('loc'), userId, name: '冰箱', parentId: null }
    const locBath = { id: uid('loc'), userId, name: '卫生间', parentId: null }
    const locCabinet = { id: uid('loc'), userId, name: '储物柜', parentId: null }
    const locCloset = { id: uid('loc'), userId, name: '卧室衣柜', parentId: null }
    db.locations.push(locFridge, locBath, locCabinet, locCloset)

    const demos = [
      {
        name: '纯牛奶',
        categoryId: 'cat_food',
        locationId: locFridge.id,
        quantity: 6,
        unit: '盒',
        price: 62.5,
        lowStockThreshold: 2,
        expireAt: day(12),
        spec: '250ml × 12',
        remark: '早餐常备',
        coverUrl: '/images/demo/milk.jpg',
      },
      {
        name: '鲜奶瓶装',
        categoryId: 'cat_food',
        locationId: locFridge.id,
        quantity: 3,
        unit: '瓶',
        price: 15.8,
        lowStockThreshold: 1,
        expireAt: day(5),
        spec: '950ml',
        remark: '临期提醒',
        coverUrl: '/images/demo/bottle.jpg',
      },
      {
        name: '婴儿纸尿裤',
        categoryId: 'cat_baby',
        locationId: locCabinet.id,
        quantity: 28,
        unit: '片',
        price: 89,
        lowStockThreshold: 10,
        expireAt: null,
        spec: 'L 码',
        remark: '日用消耗快',
        coverUrl: '/images/demo/diaper.jpg',
      },
      {
        name: '洗发水',
        categoryId: 'cat_daily',
        locationId: locBath.id,
        quantity: 2,
        unit: '瓶',
        price: 49.9,
        lowStockThreshold: 1,
        expireAt: day(280),
        spec: '500ml',
        remark: '',
        coverUrl: '/images/demo/shampoo.jpg',
      },
      {
        name: '护发素',
        categoryId: 'cat_daily',
        locationId: locBath.id,
        quantity: 1,
        unit: '瓶',
        price: 56,
        lowStockThreshold: 1,
        expireAt: day(300),
        spec: '400ml',
        remark: '',
        coverUrl: '/images/demo/conditioner.jpg',
      },
      {
        name: '洗手液',
        categoryId: 'cat_daily',
        locationId: locBath.id,
        quantity: 2,
        unit: '瓶',
        price: 22,
        lowStockThreshold: 1,
        expireAt: day(400),
        spec: '500ml',
        remark: '洗手台',
        coverUrl: '/images/demo/soap.jpg',
      },
      {
        name: '洗衣液',
        categoryId: 'cat_daily',
        locationId: locCabinet.id,
        quantity: 1,
        unit: '瓶',
        price: 39.9,
        lowStockThreshold: 1,
        expireAt: day(500),
        spec: '2kg',
        remark: '阳台储物',
        coverUrl: '/images/demo/detergent.jpg',
      },
      {
        name: '抽纸',
        categoryId: 'cat_daily',
        locationId: locCabinet.id,
        quantity: 8,
        unit: '包',
        price: 29.9,
        lowStockThreshold: 3,
        expireAt: null,
        spec: '130抽',
        remark: '整箱拆开',
        coverUrl: '/images/demo/tissue.jpg',
      },
      {
        name: '牙膏',
        categoryId: 'cat_daily',
        locationId: locBath.id,
        quantity: 3,
        unit: '支',
        price: 18.5,
        lowStockThreshold: 1,
        expireAt: day(360),
        spec: '120g',
        remark: '',
        coverUrl: '/images/demo/toothpaste.jpg',
      },
      {
        name: '保湿面霜',
        categoryId: 'cat_daily',
        locationId: locBath.id,
        quantity: 1,
        unit: '盒',
        price: 128,
        lowStockThreshold: 1,
        expireAt: day(200),
        spec: '50g',
        remark: '贵重护肤',
        coverUrl: '/images/demo/skincare.jpg',
      },
    ]

    demos.forEach((d, idx) => {
      db.items.push({
        id: `item_demo_${idx + 1}`,
        userId,
        name: d.name,
        categoryId: d.categoryId,
        locationId: d.locationId,
        quantity: d.quantity,
        unit: d.unit,
        price: d.price,
        lowStockThreshold: d.lowStockThreshold,
        expireAt: d.expireAt,
        spec: d.spec,
        remark: d.remark,
        coverUrl: d.coverUrl,
        createdAt: now,
        updatedAt: now,
      })
    })

    return true
  })
}

// —— Items ——
function listItems(params = {}) {
  const userId = requireUserId()
  ensureDemoData(userId)
  const db = readDb()
  let list = db.items.filter((i) => i.userId === userId)

  if (params.q) {
    const q = String(params.q).toLowerCase()
    list = list.filter(
      (i) =>
        (i.name && i.name.toLowerCase().includes(q)) ||
        (i.spec && i.spec.toLowerCase().includes(q)) ||
        (i.remark && i.remark.toLowerCase().includes(q)),
    )
  }
  if (params.categoryId) {
    list = list.filter((i) => i.categoryId === params.categoryId)
  }
  if (params.locationId) {
    list = list.filter((i) => i.locationId === params.locationId)
  }

  list = list
    .map((i) => decorateItem(i, db))
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))

  return { list, total: list.length }
}

function itemDetail(id) {
  const userId = requireUserId()
  const db = readDb()
  const item = db.items.find((i) => i.id === id && i.userId === userId)
  if (!item) throw { message: '物品不存在' }
  return decorateItem(item, db)
}

function createItem(data) {
  const userId = requireUserId()
  return withDb((db) => {
    const now = new Date().toISOString()
    const item = {
      id: uid('item'),
      userId,
      name: String(data.name || '').trim(),
      categoryId: data.categoryId,
      locationId: data.locationId || null,
      quantity: Number(data.quantity) || 0,
      unit: data.unit || '个',
      price: data.price == null || data.price === '' ? null : Number(data.price),
      lowStockThreshold:
        data.lowStockThreshold == null || data.lowStockThreshold === ''
          ? null
          : Number(data.lowStockThreshold),
      expireAt: data.expireAt || null,
      spec: data.spec || null,
      remark: data.remark || null,
      coverUrl: data.coverUrl || null,
      createdAt: now,
      updatedAt: now,
    }
    if (!item.name || !item.categoryId) throw { message: '请填写名称和分类' }
    db.items.push(item)
    return decorateItem(item, db)
  })
}

function updateItem(id, data) {
  const userId = requireUserId()
  return withDb((db) => {
    const item = db.items.find((i) => i.id === id && i.userId === userId)
    if (!item) throw { message: '物品不存在' }
    const fields = [
      'name',
      'categoryId',
      'locationId',
      'quantity',
      'unit',
      'price',
      'lowStockThreshold',
      'expireAt',
      'spec',
      'remark',
      'coverUrl',
    ]
    fields.forEach((k) => {
      if (data[k] !== undefined) {
        if (k === 'quantity' || k === 'price' || k === 'lowStockThreshold') {
          if (data[k] === '' || data[k] == null) {
            item[k] = k === 'quantity' ? 0 : null
          } else {
            item[k] = Number(data[k])
          }
        } else if (k === 'locationId') {
          item[k] = data[k] || null
        } else {
          item[k] = data[k]
        }
      }
    })
    item.updatedAt = new Date().toISOString()
    return decorateItem(item, db)
  })
}

function removeItem(id) {
  const userId = requireUserId()
  return withDb((db) => {
    db.items = db.items.filter((i) => !(i.id === id && i.userId === userId))
    db.logs = db.logs.filter((l) => l.itemId !== id)
    return true
  })
}

function changeStock(id, { delta, reason, note }) {
  const userId = requireUserId()
  return withDb((db) => {
    const item = db.items.find((i) => i.id === id && i.userId === userId)
    if (!item) throw { message: '物品不存在' }
    const d = Number(delta) || 0
    item.quantity = Number(item.quantity) + d
    if (item.quantity < 0) item.quantity = 0
    item.updatedAt = new Date().toISOString()
    db.logs.unshift({
      id: uid('log'),
      itemId: id,
      userId,
      delta: d,
      quantityAfter: item.quantity,
      reason: reason || (d >= 0 ? 'purchase' : 'use'),
      note: note || '',
      createdAt: new Date().toISOString(),
    })
    return decorateItem(item, db)
  })
}

function itemLogs(id) {
  const userId = requireUserId()
  const db = readDb()
  return db.logs
    .filter((l) => l.itemId === id && l.userId === userId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

function alertSummary() {
  const userId = requireUserId()
  ensureDemoData(userId)
  const db = readDb()
  const items = db.items
    .filter((i) => i.userId === userId)
    .map((i) => decorateItem(i, db))
  const expired = items.filter((i) => i.isExpired)
  const expiringSoon = items.filter((i) => i.isExpiringSoon)
  const lowStock = items.filter((i) => i.isLowStock)
  return {
    expired,
    expiringSoon,
    lowStock,
    expiredCount: expired.length,
    expiringSoonCount: expiringSoon.length,
    lowStockCount: lowStock.length,
  }
}

/** 把相册/拍照文件落到本地用户目录，返回可长期使用的本地路径 */
function saveLocalImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager()
    const extMatch = /\.[a-zA-Z0-9]+$/.exec(tempFilePath)
    const ext = (extMatch && extMatch[0]) || '.jpg'
    const dest = `${wx.env.USER_DATA_PATH}/cover_${Date.now()}${ext}`
    fs.saveFile({
      tempFilePath,
      filePath: dest,
      success: () => resolve({ url: dest }),
      fail: (err) => {
        // 部分基础库 saveFile 不支持自定义 filePath，退回默认
        fs.saveFile({
          tempFilePath,
          success: (res) => resolve({ url: res.savedFilePath }),
          fail: reject,
        })
      },
    })
  })
}

module.exports = {
  register,
  login,
  listCategories,
  createCategory,
  updateCategory,
  removeCategory,
  locationTree,
  createLocation,
  updateLocation,
  removeLocation,
  listItems,
  itemDetail,
  createItem,
  updateItem,
  removeItem,
  changeStock,
  itemLogs,
  alertSummary,
  saveLocalImage,
}
