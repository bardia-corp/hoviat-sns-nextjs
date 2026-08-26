/**
 * Search state, as URL state.
 *
 * Filters live in the query string and nowhere else. That is what makes
 * results server-renderable, shareable, crawlable, and correct under
 * back/forward navigation. Nothing in this file talks to the network: the
 * request itself is lib/api/profiles.ts.
 *
 * The semantics this file has to respect, from the API guide:
 *
 *   - q is split on spaces and every word must appear in at least one public
 *     field, so more words narrow the result. Only the first five count.
 *   - country is exact, case-sensitive equality.
 *   - occupation is a case-insensitive contains match.
 *   - All parameters are AND-ed.
 *   - Sorting is fixed at user_id descending, so paging is stable.
 */

import { PAGE_SIZE } from "./people"

export type SearchQuery = {
  q?: string
  country?: string
  occupation?: string
  is_registered?: boolean
  page?: number
  size?: number
}

/** The API uses at most five words from q and silently drops the rest. */
export const MAX_QUERY_WORDS = 5

export function queryWords(q: string | undefined): string[] {
  if (!q) return []
  return q.trim().split(/\s+/).filter(Boolean)
}

/** True when the person typed more words than the backend will consider. */
export function hasExtraWords(q: string | undefined): boolean {
  return queryWords(q).length > MAX_QUERY_WORDS
}

/* Trim to the five words that actually count before sending, so the URL says
   exactly what the server did. */
export function normaliseQueryText(q: string | undefined): string | undefined {
  const words = queryWords(q).slice(0, MAX_QUERY_WORDS)
  return words.length > 0 ? words.join(" ") : undefined
}

export type RawParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export function parseSearchParams(params: RawParams): SearchQuery {
  const registered = first(params.is_registered)
  const page = Number(first(params.page))

  return {
    q: normaliseQueryText(first(params.q)),
    country: first(params.country) || undefined,
    occupation: first(params.occupation) || undefined,
    is_registered:
      registered === "true" ? true : registered === "false" ? false : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    size: PAGE_SIZE,
  }
}

export function buildSearchHref(
  query: SearchQuery,
  overrides: Partial<SearchQuery> = {},
): string {
  const merged = { ...query, ...overrides }
  const params = new URLSearchParams()

  if (merged.q) params.set("q", merged.q)
  if (merged.country) params.set("country", merged.country)
  if (merged.occupation) params.set("occupation", merged.occupation)
  if (typeof merged.is_registered === "boolean") {
    params.set("is_registered", String(merged.is_registered))
  }
  if (merged.page && merged.page > 1) params.set("page", String(merged.page))

  const qs = params.toString()
  return qs ? "/discover?" + qs : "/discover"
}

export function activeFilterCount(query: SearchQuery): number {
  let count = 0
  if (query.country) count++
  if (query.occupation) count++
  if (typeof query.is_registered === "boolean") count++
  return count
}
