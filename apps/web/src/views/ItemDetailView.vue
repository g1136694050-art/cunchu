<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { itemApi } from '../api'
import type { Item } from '../types'

const route = useRoute()
const router = useRouter()
const item = ref<Item | null>(null)
const logs = ref<any[]>([])

async function load() {
  const id = route.params.id as string
  item.value = (await itemApi.detail(id)) as any
  logs.value = (await itemApi.logs(id)) as any
}

async function changeQty(delta: number) {
  if (!item.value) return
  await itemApi.stock(item.value.id, {
    delta,
    reason: delta > 0 ? 'purchase' : 'use',
  })
  showSuccessToast(delta > 0 ? '+1' : '-1')
  await load()
}

async function removeItem() {
  if (!item.value) return
  try {
    await showConfirmDialog({
      title: '删除物品',
      message: `确定删除「${item.value.name}」？`,
    })
    await itemApi.remove(item.value.id)
    showToast('已删除')
    router.replace('/home')
  } catch {
    /* cancel */
  }
}

function formatDate(v?: string | null) {
  if (!v) return '无'
  return v.slice(0, 10)
}

onMounted(load)
</script>

<template>
  <div class="page" style="padding-bottom: 24px" v-if="item">
    <van-nav-bar title="物品详情" left-arrow @click-left="router.back()">
      <template #right>
        <span style="color: #1989fa" @click="router.push(`/items/${item.id}/edit`)">编辑</span>
      </template>
    </van-nav-bar>

    <div
      style="
        margin: 12px 16px;
        border-radius: 16px;
        overflow: hidden;
        min-height: 140px;
        color: #fff;
        padding: 20px;
      "
      :style="{ background: item.category?.color || '#5D4037' }"
    >
      <div style="font-size: 18px; font-weight: 600">{{ item.name }}</div>
      <div style="margin-top: 18px; font-size: 48px; font-weight: 700; line-height: 1">
        {{ item.quantity }}
        <span style="font-size: 16px; font-weight: 500; opacity: 0.9">{{ item.unit }}</span>
      </div>
      <div style="margin-top: 16px; display: flex; gap: 10px">
        <van-button size="small" round @click="changeQty(-1)">-1</van-button>
        <van-button size="small" round type="primary" @click="changeQty(1)">+1</van-button>
      </div>
    </div>

    <van-cell-group inset>
      <van-cell title="分类" :value="item.category?.name || '-'" />
      <van-cell title="位置" :value="item.location?.name || '未指定'" />
      <van-cell
        title="价格"
        :value="item.price != null ? `¥${item.price}` : '未标价'"
      />
      <van-cell title="保质期" :value="formatDate(item.expireAt)" />
      <van-cell title="低库存阈值" :value="item.lowStockThreshold ?? '未设置'" />
      <van-cell title="规格" :value="item.spec || '-'" />
      <van-cell title="备注" :value="item.remark || '-'" />
    </van-cell-group>

    <div style="margin: 16px 16px 8px; font-weight: 600">出入库记录</div>
    <van-cell-group inset>
      <van-cell
        v-for="log in logs"
        :key="log.id"
        :title="`${log.delta > 0 ? '+' : ''}${log.delta} → ${log.quantityAfter}`"
        :label="`${log.reason}${log.note ? ' · ' + log.note : ''}`"
        :value="log.createdAt.slice(0, 16).replace('T', ' ')"
      />
      <van-empty v-if="!logs.length" description="暂无记录" />
    </van-cell-group>

    <div style="margin: 24px 16px">
      <van-button block round type="danger" plain @click="removeItem">删除物品</van-button>
    </div>
  </div>
</template>
