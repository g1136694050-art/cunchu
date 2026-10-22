<script setup lang="ts">
import type { Item } from '../types'

defineProps<{
  item: Item
}>()

const emit = defineEmits<{
  more: [item: Item]
  open: [item: Item]
}>()
</script>

<template>
  <div
    class="stock-card"
    :class="{ 'is-expired': item.isExpired }"
    :style="{ background: item.category?.color || '#5D4037' }"
    @click="emit('open', item)"
  >
    <div class="stock-card__name">{{ item.name }}</div>
    <button
      class="stock-card__more"
      type="button"
      @click.stop="emit('more', item)"
    >
      ···
    </button>
    <div class="stock-card__qty">
      {{ Number.isInteger(item.quantity) ? item.quantity : item.quantity.toFixed(1) }}
    </div>
    <div v-if="item.isExpired" class="stock-card__badge">已过期</div>
    <div v-else-if="item.isExpiringSoon" class="stock-card__badge">临期</div>
    <div v-else-if="item.isLowStock" class="stock-card__badge">低库存</div>
  </div>
</template>
