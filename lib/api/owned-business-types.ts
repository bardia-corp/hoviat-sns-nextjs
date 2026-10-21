export type BusinessContactInput = {
  title: string
  type: "phone" | "email" | "url" | "username" | "other"
  value: string
  platform: string | null
  display_order: number
  is_visible: boolean
}

export type OwnedBusiness = {
  id: number
  name: string
  cover_image_url?: string | null
  description: string | null
  show_owner: boolean
  owner_show_profile: boolean
  admin_allows_owner_visibility: boolean
  status: "draft" | "published" | "hidden" | "archived"
  address: string | null
  postal_code: string | null
  city: string | null
  state: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  contacts: Array<BusinessContactInput & { id: number }>
  categories: Array<{
    category_id: number
    is_primary: boolean
    category: { id: number; name: string; slug: string } | null
  }>
  created_at: string
  updated_at: string
}

export type OwnedBusinessPatch = {
  expected_updated_at: string
  name?: string
  description?: string | null
  address?: string | null
  postal_code?: string | null
  city?: string | null
  state?: string | null
  country_code?: string | null
  latitude?: number | null
  longitude?: number | null
  contacts?: BusinessContactInput[]
  owner_show_profile?: boolean
}

export type OwnedBusinessList = {
  items: OwnedBusiness[]
  meta: { total: number; page: number; size: number; pages: number }
}
