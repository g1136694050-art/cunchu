<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { alertApi, categoryApi, itemApi, locationApi } from '../api'
import type { Category, Item, LocationNode } from '../types'

const router = useRouter()
const keyword = ref('')
const loading = ref(false)
const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const locations = ref<LocationNode[]>([])
const activeTab = ref('all')
const locationId = ref('')
const locationLabel = ref('全部位置')
const showLocPicker = ref(false)
const summary = ref({
  expiredCount: 0,
  expiringSoonCount: 0,
  lowStockCount: 0,
})
const actionItem = ref<Item | null>(null)
const showActions = ref(false)

const flatLocations = computed(() => {
  const result: { id: string; name: string }[] = []
  const walk = (nodes: LocationNode[], prefix = '') => {
    for (const n of nodes) {
      const label = prefix ? `${prefix} / ${n.name}` : n.name
      result.push({ id: n.id, name: label })
      if (n.children?.length) walk(n.children, label)
    }
  }
  walk(locations.value)
  return result
})

const tabs = computed(() => {
  const base = [
    { key: 'all', title: '全部' },
    { key: 'soon', title: '临期' },
    { key: 'low', title: '低库存' },
  ]
  return [
    ...base,
    ...categories.value.map((c) => ({ key: `cat:${c.id}`, title: c.name })),
  ]
})

const featured = computed(() => {
  return [...items.value]
    .sort((a, b) => {
      const ap = a.price ?? -1
      const bp = b.price ?? -1
      if (ap !== bp) return bp - ap
      return b.quantity - a.quantity
    })
    .slice(0, 6)
})

const listItems = computed(() => items.value)

function formatPrice(price?: number | null) {
  if (price == null) return null
  const n = Number(price)
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function formatQty(item: Item) {
  const q = item.quantity
  return Number.isInteger(q) ? String(q) : q.toFixed(1)
}

function coverStyle(item: Item) {
  if (item.coverUrl) {
    return {
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.55)), url(${item.coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return {
    background: `linear-gradient(145deg, ${item.category?.color || '#5D4037'}, #1a1a1a)`,
  }
}

function thumbStyle(item: Item) {
  if (item.coverUrl) {
    return {
      backgroundImage: `url(${item.coverUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: item.category?.color || '#90A4AE' }
}

function itemTags(item: Item) {
  const tags: string[] = []
  if (item.spec) tags.push(item.spec)
  if (item.isExpiringSoon) tags.push('临期')
  if (item.isExpired) tags.push('已过期')
  if (item.isLowStock) tags.push('低库存')
  if (item.location?.name) tags.push(item.location.name)
  return tags.slice(0, 3)
}

async function loadMeta() {
  const [cats, locs]: any[] = await Promise.all([
    categoryApi.list(),
    locationApi.tree(),
  ])
  categories.value = cats
  locations.value = locs
}

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      q: keyword.value || undefined,
      pageSize: 100,
    }
    if (locationId.value) params.locationId = locationId.value
    if (activeTab.value === 'soon') params.expire = 'soon'
    else if (activeTab.value === 'low') params.lowStock = '1'
    else if (activeTab.value.startsWith('cat:')) {
      params.categoryId = activeTab.value.slice(4)
    }

    const [listRes, alertRes]: any[] = await Promise.all([
      itemApi.list(params),
      alertApi.summary(),
    ])
    items.value = listRes.list || []
    summary.value = {
      expiredCount: alertRes.expiredCount,
      expiringSoonCount: alertRes.expiringSoonCount,
      lowStockCount: alertRes.lowStockCount,
    }
  } finally {
    loading.value = false
  }
}

function onSearch() {
  load()
}

function onTabChange(name: string | number) {
  activeTab.value = String(name)
  load()
}

function openItem(item: Item) {
  router.push(`/items/${item.id}`)
}

function openMore(item: Item) {
  actionItem.value = item
  showActions.value = true
}

async function changeQty(delta: number) {
  if (!actionItem.value) return
  try {
    await itemApi.stock(actionItem.value.id, {
      delta,
      reason: delta > 0 ? 'purchase' : 'use',
    })
    showSuccessToast(delta > 0 ? '已入库 +1' : '已出库 -1')
    showActions.value = false
    await load()
  } catch {
    /* toast handled */
  }
}

async function removeItem() {
  if (!actionItem.value) return
  try {
    await showConfirmDialog({
      title: '删除物品',
      message: `确定删除「${actionItem.value.name}」？`,
    })
    await itemApi.remove(actionItem.value.id)
    showToast('已删除')
    showActions.value = false
    await load()
  } catch {
    /* cancel */
  }
}

const alertText = computed(() => {
  const parts: string[] = []
  if (summary.value.expiringSoonCount) parts.push(`临期 ${summary.value.expiringSoonCount}`)
  if (summary.value.expiredCount) parts.push(`过期 ${summary.value.expiredCount}`)
  if (summary.value.lowStockCount) parts.push(`低库存 ${summary.value.lowStockCount}`)
  return parts.join(' · ')
})

onMounted(async () => {
  await loadMeta()
  await load()
})
</script>

<template>
  <div class="home-page">
    <div class="home-hero">
      <div class="home-top">
        <button class="loc-pill" type="button" @click="showLocPicker = true">
          <van-icon name="location-o" />
          <span>{{ locationLabel }}</span>
          <van-icon name="arrow-down" />
        </button>
        <van-search
          v-model="keyword"
          class="home-search"
          shape="round"
          placeholder="搜索物品 / 规格 / 备注"
          background="transparent"
          @search="onSearch"
          @clear="onSearch"
        />
      </div>

      <van-tabs
        v-model:active="activeTab"
        shrink
        color="#2f6bff"
        title-active-color="#1a1a1a"
        title-inactive-color="#8e8e93"
        line-width="18"
        @change="onTabChange"
      >
        <van-tab
          v-for="tab in tabs"
          :key="tab.key"
          :title="tab.title"
          :name="tab.key"
        />
      </van-tabs>
    </div>

    <div
      v-if="alertText"
      class="summary-bar home-alert"
      @click="router.push('/alerts')"
    >
      ⚠ {{ alertText }}
    </div>

    <van-pull-refresh v-model="loading" @refresh="load">
      <van-empty v-if="!loading && !items.length" description="还没有物品，点右下角添加" />

      <template v-else>
        <section v-if="featured.length" class="section">
          <div class="section-head">
            <h2>精选存量</h2>
            <span class="section-sub">按价格 / 数量优先</span>
          </div>
          <div class="feature-scroll">
            <article
              v-for="item in featured"
              :key="`f-${item.id}`"
              class="feature-card"
              :style="coverStyle(item)"
              @click="openItem(item)"
              @contextmenu.prevent="openMore(item)"
            >
              <div class="feature-card__top">
                <span class="tag-dark">{{ item.category?.name || '未分类' }}</span>
                <button class="more-btn" type="button" @click.stop="openMore(item)">···</button>
              </div>
              <div class="feature-card__body">
                <h3>{{ item.name }}</h3>
                <p>
                  <van-icon name="location-o" />
                  {{ item.location?.name || '未指定位置' }}
                </p>
                <div class="feature-card__foot">
                  <span v-if="formatPrice(item.price)" class="price">
                    ¥{{ formatPrice(item.price) }}
                  </span>
                  <span v-else class="price muted">暂无标价</span>
                  <span class="qty-chip">存量 {{ formatQty(item) }}{{ item.unit }}</span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>全部物品</h2>
            <span class="link-more" @click="router.push('/alerts')">提醒中心 ›</span>
          </div>

          <div class="item-list">
            <article
              v-for="item in listItems"
              :key="item.id"
              class="list-card"
              @click="openItem(item)"
            >
              <div class="list-card__cover" :style="thumbStyle(item)">
                <span class="cover-tag">{{ item.category?.name || '其它' }}</span>
              </div>
              <div class="list-card__main">
                <div class="list-card__title-row">
                  <h3>{{ item.name }}</h3>
                  <button class="more-btn light" type="button" @click.stop="openMore(item)">
                    ···
                  </button>
                </div>
                <div v-if="item.remark || item.spec" class="spec-pill">
                  {{ item.spec || item.remark }}
                </div>
                <div class="tag-row">
                  <span v-for="tag in itemTags(item)" :key="tag" class="outline-tag">
                    {{ tag }}
                  </span>
                </div>
                <div class="list-card__foot">
                  <span class="sold">存量 {{ formatQty(item) }}{{ item.unit }}</span>
                  <span v-if="formatPrice(item.price)" class="price">
                    ¥{{ formatPrice(item.price) }}
                  </span>
                  <span v-else class="price muted">暂无标价</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </van-pull-refresh>

    <div class="fab-add">
      <van-button
        type="primary"
        icon="plus"
        round
        color="#2f6bff"
        style="width: 52px; height: 52px"
        @click="router.push('/items/create')"
      />
    </div>

    <van-action-sheet
      v-model:show="showActions"
      :actions="[
        { name: '增加 1', value: 'plus' },
        { name: '减少 1', value: 'minus' },
        { name: '查看详情', value: 'detail' },
        { name: '编辑', value: 'edit' },
        { name: '删除', value: 'delete', color: '#ee0a24' },
      ]"
      cancel-text="取消"
      close-on-click-action
      @select="
        (action: any) => {
          if (action.value === 'plus') changeQty(1)
          else if (action.value === 'minus') changeQty(-1)
          else if (action.value === 'detail' && actionItem) openItem(actionItem)
          else if (action.value === 'edit' && actionItem)
            router.push(`/items/${actionItem.id}/edit`)
          else if (action.value === 'delete') removeItem()
        }
      "
    />

    <van-popup v-model:show="showLocPicker" position="bottom" round>
      <van-picker
        :columns="[
          { text: '全部位置', value: '' },
          ...flatLocations.map((l) => ({ text: l.name, value: l.id })),
        ]"
        @confirm="
          ({ selectedOptions }: any) => {
            locationId = selectedOptions[0].value
            locationLabel = selectedOptions[0].text
            showLocPicker = false
            load()
          }
        "
        @cancel="showLocPicker = false"
      />
    </van-popup>
  </div>
</template>
