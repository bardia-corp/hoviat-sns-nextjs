/**
 * The mock backend, used when SNS_USE_MOCK=1.
 *
 * It reimplements the API's search semantics rather than something more
 * generous, deliberately: if the mock were kinder than the real thing, the UI
 * would come to depend on behaviour that does not exist. So country is exact
 * and case-sensitive here too, q is a multi-word AND across the public fields
 * with country included, a null field is unmatchable, and results are sorted
 * by user_id descending.
 */

import { PAGE_SIZE, PEOPLE } from "./people"
import type { Profile, SearchResult } from "./api/types"
import { MAX_QUERY_WORDS, queryWords, type SearchQuery } from "./search"

/* The fields q searches, per the guide. country is in this list and was not
   in the earlier contract, which is why the search placeholder changed. */
const Q_FIELDS: Array<keyof Profile> = [
  "username",
  "nickname",
  "first_name",
  "last_name",
  "bio",
  "occupation",
  "country",
]

function contains(value: unknown, needle: string): boolean {
  if (typeof value !== "string" || !value) return false
  return value.toLowerCase().includes(needle.toLowerCase())
}

function matches(person: Profile, query: SearchQuery): boolean {
  /* Every word must hit at least one public field: strict AND across words,
     OR across fields. */
  for (const word of queryWords(query.q).slice(0, MAX_QUERY_WORDS)) {
    const hit = Q_FIELDS.some((field) => contains(person[field], word))
    if (!hit) return false
  }

  /* Exact and case-sensitive, matching the backend. This is why the country
     picker offers canonical values instead of free text alone. */
  if (query.country && person.country !== query.country) return false

  if (query.occupation && !contains(person.occupation, query.occupation)) {
    return false
  }

  if (
    typeof query.is_registered === "boolean" &&
    person.is_registered !== query.is_registered
  ) {
    return false
  }

  if (person.is_ban) return false

  return true
}

export function mockSearch(query: SearchQuery): SearchResult {
  const size = Math.min(Math.max(query.size ?? PAGE_SIZE, 1), 100)

  const matched = PEOPLE.filter((person) => matches(person, query)).sort(
    (a, b) => b.user_id - a.user_id,
  )

  const total = matched.length
  const pages = Math.max(1, Math.ceil(total / size))
  const page = Math.min(Math.max(query.page ?? 1, 1), pages)
  const start = (page - 1) * size

  return {
    data: matched.slice(start, start + size),
    meta: { total, page, size, pages },
  }
}

export function mockProfile(userId: number): Profile | null {
  return PEOPLE.find((person) => person.user_id === userId) ?? null
}
