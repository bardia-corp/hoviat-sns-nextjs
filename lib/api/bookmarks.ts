import "server-only"
import { apiRequest } from "./http"
import type { Profile } from "./types"

/**
 * Bookmarks. All three endpoints need the JWT, so nothing here is cached and
 * nothing here is public.
 *
 * The list endpoint returns whole profiles, newest first. That is convenient
 * for the bookmarks page and wasteful for the card icons, which only need the
 * ids - hence listBookmarkIds, which reuses the same response.
 */
export async function listBookmarks(token: string): Promise<{
  data: Profile[]
  total: number
}> {
  const { data, meta } = await apiRequest<Profile[]>("/bookmarks", { token })
  const rows = Array.isArray(data) ? data : []
  const total = Number(meta.total)

  return {
    data: rows,
    total: Number.isFinite(total) ? total : rows.length,
  }
}

export async function listBookmarkIds(token: string): Promise<number[]> {
  const { data } = await listBookmarks(token)
  return data.map((person) => person.user_id)
}

/* Both of these are idempotent per the guide, so a double tap is harmless and
   the UI does not have to guard against it. */
export async function addBookmark(
  token: string,
  userId: number,
): Promise<boolean> {
  const { data } = await apiRequest<{ bookmarked: boolean }>(
    "/bookmarks/" + userId,
    { method: "POST", token },
  )
  return data?.bookmarked ?? true
}

export async function removeBookmark(
  token: string,
  userId: number,
): Promise<boolean> {
  const { data } = await apiRequest<{ bookmarked: boolean }>(
    "/bookmarks/" + userId,
    { method: "DELETE", token },
  )
  return data?.bookmarked ?? false
}
