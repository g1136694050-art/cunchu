<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function onSubmit() {
  if (!username.value || !password.value) return
  loading.value = true
  try {
    await userStore.login(username.value.trim(), password.value)
    showSuccessToast('登录成功')
    router.replace('/home')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-brand">
      <h1>收纳屋</h1>
      <p>一眼看清家里还有多少</p>
    </div>
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          name="username"
          label="账号"
          placeholder="请输入账号"
          :rules="[{ required: true, message: '请填写账号' }]"
        />
        <van-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
          :rules="[{ required: true, message: '请填写密码' }]"
          @click-right-icon="showPassword = !showPassword"
        />
      </van-cell-group>
      <div style="margin: 24px 16px">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          登录
        </van-button>
        <van-button
          round
          block
          plain
          type="primary"
          style="margin-top: 12px"
          @click="router.push('/register')"
        >
          注册账号
        </van-button>
      </div>
    </van-form>
  </div>
</template>
