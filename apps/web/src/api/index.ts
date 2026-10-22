import http from './http'

export const authApi = {
  login: (data: { username: string; password: string }) =>
    http.post('/auth/login', data),
  register: (data: { username: string; password: string; nickname?: string }) =>
    http.post('/auth/register', data),
  me: () => http.get('/me'),
}

export const categoryApi = {
  list: () => http.get('/categories'),
  create: (data: { name: string; color: string }) =>
    http.post('/categories', data),
  update: (id: string, data: Partial<{ name: string; color: string }>) =>
    http.patch(`/categories/${id}`, data),
  remove: (id: string) => http.delete(`/categories/${id}`),
}

export const locationApi = {
  tree: () => http.get('/locations'),
  create: (data: { name: string; parentId?: string }) =>
    http.post('/locations', data),
  update: (id: string, data: Partial<{ name: string; parentId?: string }>) =>
    http.patch(`/locations/${id}`, data),
  remove: (id: string) => http.delete(`/locations/${id}`),
}

export const itemApi = {
  list: (params?: Record<string, unknown>) => http.get('/items', { params }),
  detail: (id: string) => http.get(`/items/${id}`),
  create: (data: Record<string, unknown>) => http.post('/items', data),
  update: (id: string, data: Record<string, unknown>) =>
    http.patch(`/items/${id}`, data),
  remove: (id: string) => http.delete(`/items/${id}`),
  stock: (id: string, data: { delta: number; reason?: string; note?: string }) =>
    http.post(`/items/${id}/stock`, data),
  logs: (id: string) => http.get(`/items/${id}/logs`),
}

export const alertApi = {
  summary: () => http.get('/alerts/summary'),
}

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return http.post('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
