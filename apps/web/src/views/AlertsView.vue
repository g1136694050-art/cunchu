<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { alertApi } from '../api'
import type { Item } from '../types'

const router = useRouter()
const loading = ref(false)
const data = ref<{
  expired: Item[]
  expiringSoon: Item[]
  lowStock: Item[]
  expiredCount: number
  expiringSoonCount: number
  lowStockCount: number
}>({
  expired: [],
  expiringSoon: [],
  lowStock: [],
  expiredCount: 0,
  expiringSoonCount: 0,
  lowStockCount: 0,
})

async function load() {
  loading.value = true
  try {
    data.value = (await alertApi.summary()) as any
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <h1 class="page-title">提醒</h1>
    <van-pull-refresh v-model="loading" @refresh="load">
      <van-cell-group inset title="临期（7天内）">
        <van-cell
          v-for="item in data.expiringSoon"
          :key="item.id"
          :title="item.name"
          :label="item.expireAt?.slice(0, 10)"
          :value="`${item.quantity}${item.unit}`"
          is-link
          @click="router.push(`/items/${item.id}`)"
        />
        <van-empty v-if="!data.expiringSoon.length" image-size="60" description="暂无临期" />
      </van-cell-group>

      <van-cell-group inset title="已过期" style="margin-top: 12px">
        <van-cell
          v-for="item in data.expired"
          :key="item.id"
          :title="item.name"
          :label="item.expireAt?.slice(0, 10)"
          :value="`${item.quantity}${item.unit}`"
          is-link
          @click="router.push(`/items/${item.id}`)"
        />
        <van-empty v-if="!data.expired.length" image-size="60" description="暂无过期" />
      </van-cell-group>

      <van-cell-group inset title="低库存" style="margin-top: 12px">
        <van-cell
          v-for="item in data.lowStock"
          :key="item.id"
          :title="item.name"
          :label="`阈值 ${item.lowStockThreshold}`"
          :value="`${item.quantity}${item.unit}`"
          is-link
          @click="router.push(`/items/${item.id}`)"
        />
        <van-empty v-if="!data.lowStock.length" image-size="60" description="库存充足" />
      </van-cell-group>
    </van-pull-refresh>
  </div>
</template>
