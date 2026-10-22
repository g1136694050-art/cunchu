import axios from 'axios'
import { showToast } from 'vant'

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body.code === 'number' && body.code !== 0) {
      showToast(body.message || '请求失败')
      return Promise.reject(body)
    }
    return body?.data !== undefined ? body.data : body
  },
  (err) => {
    const status = err.response?.status
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      '网络错误'
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!location.hash.includes('/login')) {
        location.hash = '#/login'
      }
    } else {
      showToast(Array.isArray(message) ? message[0] : message)
    }
    return Promise.reject(err)
  },
)

export default http
