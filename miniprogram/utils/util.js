function formatPrice(price) {
  if (price == null || price === '') return null
  const n = Number(price)
  if (Number.isNaN(n)) return null
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function formatQty(quantity) {
  const q = Number(quantity)
  if (Number.isNaN(q)) return '0'
  return Number.isInteger(q) ? String(q) : q.toFixed(1)
}

function formatDate(v) {
  if (!v) return '无'
  return String(v).slice(0, 10)
}

function formatDateTime(v) {
  if (!v) return ''
  return String(v).slice(0, 16).replace('T', ' ')
}

function flattenLocations(nodes, prefix) {
  const result = []
  const list = Array.isArray(nodes) ? nodes : []
  list.forEach((n) => {
    const label = prefix ? `${prefix} / ${n.name}` : n.name
    result.push({ id: n.id, name: label })
    if (n.children && n.children.length) {
      result.push(...flattenLocations(n.children, label))
    }
  })
  return result
}

function itemTags(item) {
  const tags = []
  if (item.spec) tags.push(item.spec)
  if (item.isExpiringSoon) tags.push('临期')
  if (item.isExpired) tags.push('已过期')
  if (item.isLowStock) tags.push('低库存')
  if (item.location && item.location.name) tags.push(item.location.name)
  return tags.slice(0, 3)
}

function enrichItem(item, resolveUrl) {
  if (!item) return item
  const coverUrl = item.coverUrl ? resolveUrl(item.coverUrl) : ''
  const color = (item.category && item.category.color) || '#90A4AE'
  return {
    ...item,
    coverUrl,
    categoryColor: color,
    categoryName: (item.category && item.category.name) || '未分类',
    locationName: (item.location && item.location.name) || '',
    priceText: formatPrice(item.price),
    qtyText: formatQty(item.quantity),
    tags: itemTags(item),
  }
}

module.exports = {
  formatPrice,
  formatQty,
  formatDate,
  formatDateTime,
  flattenLocations,
  itemTags,
  enrichItem,
}
