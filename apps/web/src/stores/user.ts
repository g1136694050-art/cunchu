import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

type User = { id: string; username: string; nickname?: string }

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<User | null>(
    localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user') as string)
      : null,
  )

  const isLogin = computed(() => !!token.value)

  function setSession(accessToken: string, u: User) {
    token.value = accessToken
    user.value = u
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(u))
  }

  async function login(username: string, password: string) {
    const data: any = await authApi.login({ username, password })
    setSession(data.accessToken, data.user)
  }

  async function register(username: string, password: string, nickname?: string) {
    const data: any = await authApi.register({ username, password, nickname })
    setSession(data.accessToken, data.user)
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { token, user, isLogin, login, register, logout }
})
