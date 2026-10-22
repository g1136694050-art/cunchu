<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = ref('')
const nickname = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await userStore.register(
      username.value.trim(),
      password.value,
      nickname.value.trim() || undefined,
    )
    showSuccessToast('注册成功')
    router.replace('/home')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-brand">
      <h1>创建收纳屋</h1>
      <p>账号密码登录，数据云端保存</p>
    </div>
    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="username"
          label="账号"
          placeholder="至少 3 位"
          :rules="[{ required: true, message: '请填写账号' }]"
        />
        <van-field v-model="nickname" label="昵称" placeholder="可选" />
        <van-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="密码"
          placeholder="至少 3 位"
          :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
          :rules="[{ required: true, message: '请填写密码' }]"
          @click-right-icon="showPassword = !showPassword"
        />
      </van-cell-group>
      <div style="margin: 24px 16px">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          注册并登录
        </van-button>
        <van-button
          round
          block
          plain
          type="primary"
          style="margin-top: 12px"
          @click="router.push('/login')"
        >
          已有账号
        </van-button>
      </div>
    </van-form>
  </div>
</template>
