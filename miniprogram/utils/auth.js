function isGarbledName(s) {
  if (!s) return true
  const t = String(s).trim()
  if (!t) return true
  return /^[?\uFFFD？\s]+$/.test(t)
}

/** 账号像「123」这类数字时，转成可读昵称 */
function resolveNickname(username, nickname) {
  if (nickname && !isGarbledName(nickname) && !/^\d+$/.test(String(nickname).trim())) {
    return String(nickname).trim()
  }
  if (username && /^\d+$/.test(String(username).trim())) return '收纳用户'
  if (nickname && !isGarbledName(nickname)) return String(nickname).trim()
  return null
}

function normalizeUser(u) {
  if (!u) return null
  const nickname = resolveNickname(u.username, u.nickname)
  return {
    id: u.id,
    username: u.username,
    nickname,
  }
}

function getToken() {
  return wx.getStorageSync('token') || ''
}

function getUser() {
  try {
    const raw = wx.getStorageSync('user')
    if (!raw) return null
    return normalizeUser(typeof raw === 'string' ? JSON.parse(raw) : raw)
  } catch (e) {
    return null
  }
}

function displayName() {
  const user = ensureDisplayNickname()
  if (!user) return '用户'
  if (user.nickname) return user.nickname
  return user.username || '用户'
}

/** 把当前登录用户的数字账号补成文字昵称，并写回本地 session */
function ensureDisplayNickname() {
  const user = getUser()
  if (!user) return null
  const nickname = resolveNickname(user.username, user.nickname) || '收纳用户'
  if (user.nickname !== nickname) {
    const next = { ...user, nickname }
    wx.setStorageSync('user', next)
    return next
  }
  return user
}

function setSession(accessToken, user) {
  const normalized = normalizeUser(user) || {}
  if (!normalized.nickname) {
    normalized.nickname = resolveNickname(normalized.username, null) || '收纳用户'
  }
  wx.setStorageSync('token', accessToken)
  wx.setStorageSync('user', normalized)
}

function clearSession() {
  wx.removeStorageSync('token')
  wx.removeStorageSync('user')
}

function isLogin() {
  return !!getToken()
}

module.exports = {
  getToken,
  getUser,
  displayName,
  ensureDisplayNickname,
  setSession,
  clearSession,
  isLogin,
}
