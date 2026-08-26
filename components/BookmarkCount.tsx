"use client"

import { useBookmarks } from "./BookmarksProvider"
import { faDigits } from "@/lib/date"

/**
 * Bookmark total for the dashboard. Its own client component so the rest of
 * the dashboard can stay server-rendered.
 */
export default function BookmarkCount() {
  const { ids, ready } = useBookmarks()
  return <>{faDigits(ready ? ids.length : 0)}</>
}
