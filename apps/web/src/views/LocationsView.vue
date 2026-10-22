<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast, showToast } from 'vant'
import { itemApi, locationApi } from '../api'
import type { Item, LocationNode } from '../types'

const router = useRouter()
const tree = ref<LocationNode[]>([])
const activeNames = ref<string[]>([])
const showAdd = ref(false)
const name = ref('')
const parentId = ref<string | undefined>()
const parentName = ref('无（作为房间）')
const showParentPicker = ref(false)
const flat = ref<{ id: string; name: string }[]>([])
const selected = ref<LocationNode | null>(null)
const showItems = ref(false)
const locationItems = ref<Item[]>([])

function flatten(nodes: LocationNode[], prefix = '') {
  const result: { id: string; name: string }[] = []
  for (const n of nodes) {
    const label = prefix ? `${prefix} / ${n.name}` : n.name
    result.push({ id: n.id, name: label })
    if (n.children?.length) result.push(...flatten(n.children, label))
  }
  return result
}

async function load() {
  tree.value = (await locationApi.tree()) as any
  flat.value = flatten(tree.value)
  activeNames.value = tree.value.map((t) => t.id)
}

async function openLocation(loc: LocationNode) {
  selected.value = loc
  const res: any = await itemApi.list({ locationId: loc.id, pageSize: 100 })
  locationItems.value = res.list || []
  showItems.value = true
}

async function createLocation() {
  if (!name.value.trim()) return
  await locationApi.create({
    name: name.value.trim(),
    parentId: parentId.value,
  })
  showSuccessToast('已添加位置')
  showAdd.value = false
  name.value = ''
  parentId.value = undefined
  parentName.value = '无（作为房间）'
  await load()
}

async function removeLocation(loc: LocationNode) {
  try {
    await showConfirmDialog({
      title: '删除位置',
      message: `删除「${loc.name}」？其中物品将变为未指定位置`,
    })
    await locationApi.remove(loc.id)
    showToast('已删除')
    showItems.value = false
    selected.value = null
    await load()
  } catch {
    /* cancel */
  }
}

onMounted(load)
</script>

<template>
  <div class="page">
    <div style="display: flex; align-items: center; justify-content: space-between">
      <h1 class="page-title" style="margin-bottom: 8px">位置</h1>
      <van-button size="small" type="primary" round @click="showAdd = true">新增</van-button>
    </div>
    <p style="margin: 0 0 12px; color: #8e8e93; font-size: 13px">房间 → 柜子 / 冰箱 / 抽屉</p>

    <van-empty v-if="!tree.length" description="还没有位置，先新增一个房间吧" />

    <van-collapse v-if="tree.length" v-model="activeNames">
      <van-collapse-item
        v-for="room in tree"
        :key="room.id"
        :title="`${room.name}（${room.itemCount || 0}）`"
        :name="room.id"
      >
        <van-cell title="查看此位置物品" is-link @click="openLocation(room)" />
        <van-cell
          v-for="child in room.children || []"
          :key="child.id"
          :title="child.name"
          :value="`${child.itemCount || 0} 件`"
          is-link
          @click="openLocation(child)"
        />
        <van-cell title="删除此房间" style="color: #ee0a24" @click="removeLocation(room)" />
      </van-collapse-item>
    </van-collapse>

    <van-popup v-model:show="showItems" position="bottom" round style="height: 60%">
      <div style="padding: 16px">
        <div style="font-weight: 700; margin-bottom: 8px">{{ selected?.name }} 的物品</div>
        <van-cell
          v-for="it in locationItems"
          :key="it.id"
          :title="it.name"
          :value="`${it.quantity}${it.unit}`"
          is-link
          @click="router.push(`/items/${it.id}`)"
        />
        <van-empty v-if="!locationItems.length" description="此处暂无物品" />
      </div>
    </van-popup>

    <van-dialog
      v-model:show="showAdd"
      title="新增位置"
      show-cancel-button
      @confirm="createLocation"
    >
      <van-field v-model="name" label="名称" placeholder="如：主卧 / 衣柜上层" />
      <van-field
        v-model="parentName"
        is-link
        readonly
        label="上级"
        @click="showParentPicker = true"
      />
    </van-dialog>

    <van-popup v-model:show="showParentPicker" position="bottom" round>
      <van-picker
        :columns="[
          { text: '无（作为房间）', value: '' },
          ...flat.map((l) => ({ text: l.name, value: l.id })),
        ]"
        @confirm="
          ({ selectedOptions }: any) => {
            parentId = selectedOptions[0].value || undefined
            parentName = selectedOptions[0].text
            showParentPicker = false
          }
        "
        @cancel="showParentPicker = false"
      />
    </van-popup>
  </div>
</template>
