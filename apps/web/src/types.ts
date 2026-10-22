export interface Category {
  id: string
  name: string
  color: string
  icon?: string
  sort: number
  isSystem: boolean
}

export interface LocationNode {
  id: string
  name: string
  parentId?: string | null
  itemCount?: number
  children?: LocationNode[]
}

export interface Item {
  id: string
  name: string
  quantity: number
  unit: string
  price?: number | null
  categoryId: string
  locationId?: string | null
  lowStockThreshold?: number | null
  expireAt?: string | null
  spec?: string | null
  remark?: string | null
  coverUrl?: string | null
  category?: Category
  location?: { id: string; name: string; parentId?: string | null } | null
  isLowStock?: boolean
  isExpired?: boolean
  isExpiringSoon?: boolean
}
