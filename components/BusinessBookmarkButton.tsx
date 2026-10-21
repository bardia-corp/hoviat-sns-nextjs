"use client"

import type { Business } from "@/lib/api/business-types"
import { useBusinessBookmarks } from "./BusinessBookmarksProvider"
import { useAuth } from "./AuthProvider"
import UIIcon from "./UIIcon"

export default function BusinessBookmarkButton({ business }: { business: Business }) {
  const auth = useAuth()
  const bookmarks = useBusinessBookmarks()
  const saved = bookmarks.items.some((item) => item.id === business.id)
  const pending = bookmarks.pending.includes(business.id)
  return <button
    type="button"
    className={saved ? "business-save bp-save business-save--active bp-save--active" : "business-save bp-save"}
    aria-pressed={saved}
    aria-label={(saved ? "حذف از ذخیره‌ها: " : "ذخیره: ") + business.name}
    disabled={!auth.ready || (auth.signedIn && (!bookmarks.ready || Boolean(bookmarks.error))) || pending}
    onClick={() => bookmarks.toggle(business)}
  >
    <UIIcon name="bookmark" size={19} />
    <span>{pending ? "در حال ذخیره…" : saved ? "ذخیره شده" : "ذخیره"}</span>
  </button>
}
