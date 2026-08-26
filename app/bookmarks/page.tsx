"use client"

/**
 * Bookmarks.
 *
 * Client-rendered, because GET /bookmarks needs the JWT and the list is
 * private to one person - there is nothing here for a crawler. The request
 * goes to our own origin, which attaches the token server-side, so this
 * component never sees it.
 *
 * The endpoint returns whole profiles, newest first, so no local lookup or
 * re-sorting happens: what the server sends is what renders. That matters -
 * the earlier version matched ids against a local dataset, which cannot work
 * once the data lives behind an API.
 */

import { useEffect, useState } from "react"
import Link from "next/link"
import type { Profile } from "@/lib/api/types"
import { faDigits } from "@/lib/date"
import { apiFetch } from "@/lib/client-session"
import { useBookmarks } from "@/components/BookmarksProvider"
import { useAuth } from "@/components/AuthProvider"
import LoginGate from "@/components/LoginGate"
import ResultsList from "@/components/ResultsList"
import { CardListSkeleton } from "@/components/Skeleton"

export default function BookmarksPage() {
  const auth = useAuth()
  const { ids } = useBookmarks()
  const [people, setPeople] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* Re-fetched when ids change so un-bookmarking from this very page removes
     the row, rather than leaving a card whose icon disagrees with the list. */
  useEffect(() => {
    if (!auth.ready || !auth.signedIn) return

    let cancelled = false

    apiFetch<Profile[]>("/api/bookmarks")
      .then((result) => {
        if (cancelled) return

        /* An expired session is announced by apiFetch and handled centrally,
           so this screen simply has no list to show - which is not an error
           and must not be reported as one. */
        if (!result.signedIn) {
          setPeople([])
          return
        }

        if (result.ok) {
          setPeople(result.data ?? [])
        } else {
          setError(result.message ?? "فهرست ذخیره‌ها خوانده نشد.")
          setPeople([])
        }
      })
      .catch(() => {
        if (cancelled) return
        setError("ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.")
        setPeople([])
      })

    return () => {
      cancelled = true
    }
  }, [auth.ready, auth.signedIn, ids.length])

  const loading = !auth.ready || (auth.signedIn && people === null)
  const count = people?.length ?? 0

  return (
    <main className="screen">
      <header className="hero">
        <p className="hero__eyebrow">ذخیره شده</p>
        <h1 className="hero__title hero__title--sm">ذخیره‌های من</h1>
        <p className="hero__sub">
          {loading
            ? "در حال بارگذاری افراد ذخیره‌شده."
            : count === 0
              ? "هنوز کسی را ذخیره نکرده‌اید."
              : faDigits(count) + " نفر ذخیره شده است."}
        </p>
      </header>

      {/* Wait for auth.ready before showing the invitation, or someone who is
          already signed in sees it flash on every load. */}
      {auth.ready && !auth.signedIn ? (
        <LoginGate
          title="برای ذخیره کردن افراد وارد شوید"
          text="ذخیره‌ها روی حساب کاربری شما نگه داشته می‌شوند، پس برای ساختن فهرست باید وارد شوید. جستجو برای همه باز است."
        />
      ) : loading ? (
        <CardListSkeleton count={3} />
      ) : error ? (
        <div className="empty glass">{error}</div>
      ) : count === 0 ? (
        <div className="empty glass">
          در صفحه{" "}
          <Link href="/discover" style={{ fontWeight: 700 }}>
            جستجو
          </Link>{" "}
          روی علامت به‌علاوه‌ی هر کس بزنید تا اینجا ذخیره شود.
        </div>
      ) : (
        <ResultsList people={people ?? []} />
      )}
    </main>
  )
}
