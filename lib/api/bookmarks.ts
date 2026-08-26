import "server-only"
import { apiRequest } from "./http"
import type { Profile } from "./types"

/**
 * Bookmarks. All three endpoints need the JWT, so nothing here is cached and
 * nothing here is public.
 *
 * The list endpoint returns whole profiles, newest first, and is paginated.
 * size=100 - the server-side cap - is requested explicitly, because the
 * default page would quietly truncate both the bookmarks screen and the
 * filled icons on every card.
 */
export async function listBookmarks(token: string): Promise<{
  data: Profile[]
  total: number
}> {
  const { data, meta } = await apiRequest<Profile[]>("/bookmarks", {
    query: { size: 100 },
    token,
  })
  const rows = Array.isArray(data) ? data : []
  const total = Number(meta.total)

  return {
    data: rows,
    total: Number.isFinite(total) ? total : rows.length,
  }
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
