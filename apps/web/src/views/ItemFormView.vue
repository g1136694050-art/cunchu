<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { categoryApi, itemApi, locationApi, uploadApi } from '../api'
import type { Category, LocationNode } from '../types'

type LocNode = LocationNode

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id && route.name === 'item-edit')
const loading = ref(false)
const categories = ref<Category[]>([])
const flatLocations = ref<{ id: string; name: string }[]>([])
const showCatPicker = ref(false)
const showLocPicker = ref(false)
const showDatePicker = ref(false)
const coverPreview = ref('')

const form = reactive({
  name: '',
  categoryId: '',
  categoryName: '',
  locationId: '',
  locationName: '',
  quantity: 1,
  unit: '个',
  price: undefined as number | undefined,
  lowStockThreshold: undefined as number | undefined,
  expireAt: '',
  spec: '',
  remark: '',
  coverUrl: '',
})

function flattenLocations(nodes: LocNode[], prefix = '') {
  const result: { id: string; name: string }[] = []
  for (const n of nodes) {
    const label = prefix ? `${prefix} / ${n.name}` : n.name
    result.push({ id: n.id, name: label })
    if (n.children?.length) {
      result.push(...flattenLocations(n.children, label))
    }
  }
  return result
}

async function loadMeta() {
  const [cats, locs]: any[] = await Promise.all([
    categoryApi.list(),
    locationApi.tree(),
  ])
  categories.value = cats
  flatLocations.value = flattenLocations(locs)
  if (!isEdit.value && cats.length) {
    form.categoryId = cats[0].id
    form.categoryName = cats[0].name
  }
}

async function loadItem() {
  if (!isEdit.value) return
  const item: any = await itemApi.detail(route.params.id as string)
  form.name = item.name
  form.categoryId = item.categoryId
  form.categoryName = item.category?.name || ''
  form.locationId = item.locationId || ''
  form.locationName = item.location?.name || ''
  form.quantity = item.quantity
  form.unit = item.unit
  form.price = item.price ?? undefined
  form.lowStockThreshold = item.lowStockThreshold ?? undefined
  form.expireAt = item.expireAt ? item.expireAt.slice(0, 10) : ''
  form.spec = item.spec || ''
  form.remark = item.remark || ''
  form.coverUrl = item.coverUrl || ''
  coverPreview.value = item.coverUrl || ''
}

async function onUpload(file: File) {
  const res: any = await uploadApi.image(file)
  form.coverUrl = res.url
  coverPreview.value = res.url
  return { url: res.url }
}

async function onSubmit() {
  if (!form.name || !form.categoryId) return
  loading.value = true
  try {
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      locationId: form.locationId || undefined,
      quantity: Number(form.quantity),
      unit: form.unit || '个',
      price:
        form.price === undefined || form.price === null || Number.isNaN(Number(form.price))
          ? undefined
          : Number(form.price),
      lowStockThreshold:
        form.lowStockThreshold === undefined || form.lowStockThreshold === null
          ? undefined
          : Number(form.lowStockThreshold),
      expireAt: form.expireAt || undefined,
      spec: form.spec || undefined,
      remark: form.remark || undefined,
      coverUrl: form.coverUrl || undefined,
    }
    if (isEdit.value) {
      await itemApi.update(route.params.id as string, payload)
      showSuccessToast('已保存')
      router.replace(`/items/${route.params.id}`)
    } else {
      const created: any = await itemApi.create(payload)
      showSuccessToast('已添加')
      router.replace(`/items/${created.id}`)
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadMeta()
  await loadItem()
})
</script>

<template>
  <div class="page" style="padding-bottom: 24px">
    <van-nav-bar
      :title="isEdit ? '编辑物品' : '添加物品'"
      left-arrow
      @click-left="router.back()"
    />

    <div style="padding: 12px 16px">
      <van-uploader
        :max-count="1"
        :after-read="(file: any) => onUpload(file.file)"
        accept="image/*"
        capture="environment"
      >
        <div
          style="
            width: 100%;
            min-width: 160px;
            height: 120px;
            border-radius: 12px;
            background: #fff;
            display: grid;
            place-items: center;
            color: #969799;
          "
        >
          <img
            v-if="coverPreview"
            :src="coverPreview"
            style="width: 100%; height: 120px; object-fit: cover; border-radius: 12px"
          />
          <span v-else>拍照 / 相册</span>
        </div>
      </van-uploader>
    </div>

    <van-form @submit="onSubmit">
      <van-cell-group inset>
        <van-field
          v-model="form.name"
          label="名称"
          placeholder="如 NB 纸尿裤"
          required
          :rules="[{ required: true, message: '请填写名称' }]"
        />
        <van-field
          v-model="form.categoryName"
          is-link
          readonly
          label="分类"
          placeholder="选择分类"
          required
          @click="showCatPicker = true"
        />
        <van-field
          v-model.number="form.quantity"
          type="number"
          label="数量"
          required
        />
        <van-field v-model="form.unit" label="单位" placeholder="个 / 包 / 件" />
        <van-field
          v-model.number="form.price"
          type="number"
          label="价格"
          placeholder="单价，可选"
        />
        <van-field
          v-model="form.locationName"
          is-link
          readonly
          label="位置"
          placeholder="家里放哪"
          @click="showLocPicker = true"
        />
        <van-field
          v-model="form.expireAt"
          is-link
          readonly
          label="保质期"
          placeholder="可选"
          @click="showDatePicker = true"
        />
        <van-field
          v-model.number="form.lowStockThreshold"
          type="number"
          label="低库存"
          placeholder="低于此值提醒"
        />
        <van-field v-model="form.spec" label="规格" placeholder="尺码/规格，可选" />
        <van-field
          v-model="form.remark"
          rows="2"
          autosize
          type="textarea"
          label="备注"
          placeholder="可选"
        />
      </van-cell-group>
      <div style="margin: 24px 16px">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          保存
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showCatPicker" position="bottom" round>
      <van-picker
        :columns="categories.map((c) => ({ text: c.name, value: c.id }))"
        @confirm="({ selectedOptions }: any) => {
          form.categoryId = selectedOptions[0].value
          form.categoryName = selectedOptions[0].text
          showCatPicker = false
        }"
        @cancel="showCatPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showLocPicker" position="bottom" round>
      <van-picker
        :columns="[
          { text: '不指定', value: '' },
          ...flatLocations.map((l) => ({ text: l.name, value: l.id })),
        ]"
        @confirm="({ selectedOptions }: any) => {
          form.locationId = selectedOptions[0].value
          form.locationName = selectedOptions[0].text === '不指定' ? '' : selectedOptions[0].text
          showLocPicker = false
        }"
        @cancel="showLocPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        title="保质期"
        @confirm="({ selectedValues }: any) => {
          form.expireAt = selectedValues.join('-')
          showDatePicker = false
        }"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>
