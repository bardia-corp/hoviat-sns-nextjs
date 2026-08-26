"use client"

/* The one interactive island on the otherwise server-rendered profile page. */

import { useRouter } from "next/navigation"
import { useBookmarks } from "./BookmarksProvider"
import { useAuth } from "./AuthProvider"
import { BookmarkFilledIcon, PlusIcon } from "./Icons"

export default function BookmarkButton({
  userId,
  name,
}: {
  userId: number
  name: string
}) {
  const bookmarks = useBookmarks()
  const { signedIn } = useAuth()
  const router = useRouter()
  const saved = bookmarks.has(userId)

  return (
    <button
      type="button"
      className={
        saved
          ? "modal__btn modal__btn--primary"
          : "modal__btn modal__btn--ghost"
      }
      style={{ flex: 1 }}
      aria-pressed={saved}
      onClick={() =>
        signedIn ? bookmarks.toggle(userId) : router.push("/login")
      }
    >
      {saved ? <BookmarkFilledIcon size={17} /> : <PlusIcon size={17} />}
      <span>{saved ? "ذخیره شد" : "ذخیره"}</span>
      <span className="sr-only">{" " + name}</span>
    </button>
  )
}
