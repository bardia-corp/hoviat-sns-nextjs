import type { RawParams } from "./search"

export const RELEVANCE_FIELDS = [
  { key: "persian_owned", label: "مالک ایرانی / فارسی‌زبان" },
  { key: "persian_provider", label: "ارائه‌دهنده ایرانی / فارسی‌زبان" },
  { key: "persian_language", label: "امکان دریافت خدمات به فارسی" },
  { key: "persian_service", label: "محصول یا خدمت ایرانی" },
] as const

export type RelevanceKey = typeof RELEVANCE_FIELDS[number]["key"]
export type TriState = "yes" | "no" | "unknown"
export type BusinessQuery = {
  q?: string
  country_code: string
  state?: string
  city?: string
  category: number[]
  page: number
  size: number
  sort?: string
} & Partial<Record<RelevanceKey, TriState>>

const SORTS = ["relevance", "newest", "oldest", "name_asc", "name_desc", "recently_updated"]
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value

export function parseBusinessQuery(params: RawParams): BusinessQuery {
  const page = Number(first(params.page))
  const rawCountry = first(params.country_code) ?? "DE"
  const categories = [params.category ?? []].flat().map(Number)
  const sort = first(params.sort)
  const query: BusinessQuery = {
    q: first(params.q)?.trim().slice(0, 500) || undefined,
    country_code: rawCountry === "all" ? "all" : /^[a-z]{2}$/i.test(rawCountry) ? rawCountry.toUpperCase() : "DE",
    state: first(params.state)?.trim() || undefined,
    city: first(params.city)?.trim() || undefined,
    category: [...new Set(categories.filter((id) => Number.isSafeInteger(id) && id > 0))],
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    size: 10,
    sort: sort && SORTS.includes(sort) ? sort : undefined,
  }
  for (const { key } of RELEVANCE_FIELDS) {
    const value = first(params[key])
    if (value === "yes" || value === "no" || value === "unknown") query[key] = value
  }
  return query
}

export function businessSearchHref(query: BusinessQuery, overrides: Partial<BusinessQuery> = {}): string {
  const current = { ...query, ...overrides }
  const params = new URLSearchParams()
  if (current.q) params.set("q", current.q)
  if (current.country_code !== "DE") params.set("country_code", current.country_code)
  if (current.state) params.set("state", current.state)
  if (current.city) params.set("city", current.city)
  current.category.forEach((id) => params.append("category", String(id)))
  for (const { key } of RELEVANCE_FIELDS) if (current[key]) params.set(key, current[key]!)
  // Keep omission distinct from explicitly choosing newest. The API defaults
  // text searches to relevance and browsing to newest.
  if (current.sort) params.set("sort", current.sort)
  if (current.page > 1) params.set("page", String(current.page))
  return "/discover" + (params.size ? "?" + params : "")
}

export function businessLocationLabel(business: { city: string | null; state: string | null; country_code: string | null }): string {
  return [...new Set([business.city, business.state, business.country_code === "DE" ? "آلمان" : business.country_code].filter(Boolean))].join("، ")
}
