import "server-only"
import { apiRequest, SEARCH_REVALIDATE, USE_MOCK } from "./http"
import { ApiError, type Meta, type Profile, type SearchResult } from "./types"
import { mockProfile, mockSearch } from "../mock"
import type { SearchQuery } from "../search"

/**
 * The two public endpoints: search, and one profile.
 *
 * Both are cached. Search is cached because of the shared-IP rate limit - with
 * server rendering every visitor reaches the API from one address, so without
 * caching a handful of people scrolling would exhaust the minute budget for
 * everybody. A profile is cached for longer since it changes rarely.
 *
 * Both fall back to the mock dataset when SNS_USE_MOCK=1, so the design stays
 * workable while staging is down or throttled.
 */

const PROFILE_REVALIDATE = 300

function normaliseMeta(
  raw: Record<string, unknown>,
  fallbackSize: number,
  received: number,
): Meta {
  const total = Number(raw.total)
  const page = Number(raw.page)
  const size = Number(raw.size)
  const pages = Number(raw.pages)

  const safeSize = Number.isFinite(size) && size > 0 ? size : fallbackSize
  const safeTotal = Number.isFinite(total) && total >= 0 ? total : received

  return {
    total: safeTotal,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    size: safeSize,
    pages:
      Number.isFinite(pages) && pages > 0
        ? pages
        : Math.max(1, Math.ceil(safeTotal / safeSize)),
  }
}

/**
 * GET /profiles/search
 *
 * Parameters are AND-ed server-side. q is a multi-word AND across the public
 * text fields, country included, and only the first five words count - so the
 * UI never sends more than that, and says so rather than silently dropping
 * the rest.
 */
export async function searchProfiles(
  query: SearchQuery,
): Promise<SearchResult> {
  if (USE_MOCK) return mockSearch(query)

  const { data, meta } = await apiRequest<Profile[]>("/profiles/search", {
    query: {
      q: query.q,
      country: query.country,
      occupation: query.occupation,
      is_registered: query.is_registered,
      page: query.page && query.page > 1 ? query.page : undefined,
      size: query.size,
    },
    revalidate: SEARCH_REVALIDATE,
    tags: ["search"],
  })

  const rows = Array.isArray(data) ? data : []

  return {
    data: rows,
    meta: normaliseMeta(meta, query.size ?? 20, rows.length),
  }
}

/**
 * GET /profiles/{user_id}
 *
 * 404 means "does not exist" or "has turned discovery off", and the guide is
 * explicit that these must be treated identically. Returning null rather than
 * throwing lets the page call notFound() and render the normal 404.
 */
export async function getProfile(userId: number): Promise<Profile | null> {
  if (USE_MOCK) return mockProfile(userId)

  try {
    const { data } = await apiRequest<Profile>("/profiles/" + userId, {
      revalidate: PROFILE_REVALIDATE,
      tags: ["profile-" + userId],
    })
    return data ?? null
  } catch (error) {
    if (error instanceof ApiError && error.isNotFound) return null
    throw error
  }
}
