<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { categoryApi } from '../api'
import { useUserStore } from '../stores/user'
import type { Category } from '../types'

const router = useRouter()
const userStore = useUserStore()
const categories = ref<Category[]>([])
const showAdd = ref(false)
const catName = ref('')
const catColor = ref('#7CB342')

async function loadCats() {
  categories.value = (await categoryApi.list()) as any
}

async function addCategory() {
  if (!catName.value.trim()) return
  await categoryApi.create({ name: catName.value.trim(), color: catColor.value })
  showSuccessToast('已添加分类')
  showAdd.value = false
  catName.value = ''
  await loadCats()
}

async function logout() {
  try {
    await showConfirmDialog({ title: '退出登录', message: '确定退出当前账号？' })
    userStore.logout()
    router.replace('/login')
  } catch {
    /* cancel */
  }
}

onMounted(loadCats)
</script>

<template>
  <div class="page">
    <h1 class="page-title">我的</h1>

    <van-cell-group inset>
      <van-cell
        title="昵称"
        :value="userStore.user?.nickname || userStore.user?.username"
      />
      <van-cell title="账号" :value="userStore.user?.username" />
    </van-cell-group>

    <div style="margin: 16px 16px 8px; display: flex; justify-content: space-between; align-items: center">
      <span style="font-weight: 600">分类色板</span>
      <van-button size="mini" type="primary" round @click="showAdd = true">新增</van-button>
    </div>
    <van-cell-group inset>
      <van-cell v-for="c in categories" :key="c.id" :title="c.name">
        <template #value>
          <span
            :style="{
              display: 'inline-block',
              width: '18px',
              height: '18px',
              borderRadius: '6px',
              background: c.color,
              verticalAlign: 'middle',
            }"
          />
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset style="margin-top: 16px">
      <van-cell
        title="安装到主屏幕"
        label="Chrome 菜单 → 安装应用 / 添加到主屏幕"
        is-link
        @click="showToast('请使用浏览器「添加到主屏幕」安装收纳屋')"
      />
    </van-cell-group>

    <div style="margin: 24px 16px">
      <van-button block round type="danger" plain @click="logout">退出登录</van-button>
    </div>

    <van-dialog
      v-model:show="showAdd"
      title="新增分类"
      show-cancel-button
      @confirm="addCategory"
    >
      <van-field v-model="catName" label="名称" placeholder="分类名" />
      <van-field v-model="catColor" label="颜色" placeholder="#7CB342" />
    </van-dialog>
  </div>
</template>
