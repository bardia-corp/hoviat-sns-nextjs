import type { Meta } from "./types"

/** Public business data is independent of a person's account and privacy. */
export type BusinessContact = {
  title: string
  type: "phone" | "email" | "url" | "username" | "other"
  value: string
  platform: string | null
  display_order: number
}

export type Business = {
  id: number
  name: string
  description: string | null
  cover_image_url: string | null
  persian_owned: boolean | null
  persian_provider: boolean | null
  persian_language: boolean | null
  persian_service: boolean | null
  address: string | null
  postal_code: string | null
  city: string | null
  state: string | null
  country_code: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
  contacts: BusinessContact[]
  categories: { category_id: number; is_primary: boolean; category: { id: number; name: string; slug: string } }[]
}

export type BusinessCategory = {
  id: number
  name: string
  slug: string
  level?: 1 | 2
  parent_id?: number | null
  parent_ids?: number[]
  children: BusinessCategory[]
}

export type RelatedBusinessPerson = {
  user_id: number
  first_name: string | null
  last_name: string | null
  nickname?: string | null
  username?: string | null
  bio: string | null
  profile_url: string | null
  social_links: import("./types").SocialLink[]
}

export type BusinessLocation = {
  country_code: string | null
  total: number
  states: { state: string | null; total: number; cities: { city: string; count: number }[] }[]
}

export type BusinessSearchResult = { data: Business[]; meta: Meta }
