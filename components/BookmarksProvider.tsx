"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { setBookmark } from "@/app/actions/bookmarks"
import { apiFetch, notifySessionExpired } from "@/lib/client-session"
import type { Profile } from "@/lib/api/types"
import { useAuth } from "./AuthProvider"

/**
 * Bookmark state, shared by every card, modal and counter.
 *
 * Loaded once from our own origin - the token stays server-side - and kept in
 * memory afterwards. Toggling is optimistic: the icon fills the instant it is
 * tapped and only reverts if the server disagrees, because a bookmark is cheap
 * to undo and a spinner on every tap would make browsing feel like paperwork.
 *
 * The important change from the previous version: this no longer ignores what
 * the server says about the session. It used to read body.ids and nothing
 * else, so a 401 became an empty list and the user was left with an interface
 * that believed it was signed in. Now signedIn: false ends the session through
 * the shared event, and every screen updates at once.
 */

type BookmarksValue = {
  ids: number[]
  ready: boolean
  has: (userId: number) => boolean
  /** True while a specific row is in flight, for its own spinner. */
  isPending: (userId: number) => boolean
  toggle: (userId: number) => Promise<void>
  error: string | null
}

const BookmarksContext = createContext<BookmarksValue>({
  ids: [],
  ready: false,
  has: () => false,
  isPending: () => false,
  toggle: async () => {},
  error: null,
})

export function BookmarksProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { signedIn, ready: authReady } = useAuth()
  const [ids, setIds] = useState<number[]>([])
  const [ready, setReady] = useState(false)
  const [pending, setPending] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authReady) return

    if (!signedIn) {
      /* Not a request worth making, and not an error either. */
      setIds([])
      setReady(true)
      return
    }

    let cancelled = false

    /* The same request the bookmarks screen makes, so whatever it returns is
       by definition what the list shows - the icons can never disagree with
       the list again. The endpoint sends whole profiles; only the ids are
       kept. Number() guards the comparison: an upstream that serialises
       user_id as a string would otherwise miss every server id. */
    apiFetch<Profile[]>("/api/bookmarks")
      .then((result) => {
        if (cancelled) return

        /* apiFetch has already announced an expired session; there is nothing
           to show and nothing to complain about. */
        if (!result.signedIn) {
          setIds([])
          setReady(true)
          return
        }

        const rows = Array.isArray(result.data) ? result.data : []
        setIds(
          rows
            .map((row) => Number(row?.user_id))
            .filter((id) => Number.isFinite(id)),
        )

        /* A genuine failure while signed in: browsing still works, the icons
           just start empty, so this is a note rather than a blocked screen. */
        if (!result.ok) setError(result.message ?? null)

        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [authReady, signedIn])

  /* Number() on both sides, so a numeric id always matches however the
     upstream serialised it. */
  const has = useCallback(
    (userId: number) => ids.includes(Number(userId)),
    [ids],
  )

  const isPending = useCallback(
    (userId: number) => pending.includes(userId),
    [pending],
  )

  const toggle = useCallback(
    async (userId: number) => {
      const target = "/profiles/" + userId

      /* Bookmarking is the one feature that pushes a visitor towards signing
         in, so this is a redirect, not a silent failure. */
      if (!signedIn) {
        router.push("/login?next=" + encodeURIComponent(target))
        return
      }

      const next = !has(userId)
      setError(null)
      setIds((current) =>
        next ? [userId, ...current] : current.filter((id) => id !== userId),
      )
      setPending((current) => [...current, userId])

      try {
        const result = await setBookmark(userId, next)

        if (!result.ok) {
          /* Roll back to what the server believes. */
          setIds((current) =>
            next
              ? current.filter((id) => id !== userId)
              : [userId, ...current],
          )

          if (result.reason === "auth") {
            /* The action has already destroyed the cookie server-side. This
               tells the rest of the app, which signs the user out for real
               instead of leaving them staring at "please sign in" while the
               interface claims they are. */
            notifySessionExpired({ next: target, redirect: true })
            return
          }

          setError(result.message ?? null)
        }
      } catch {
        setIds((current) =>
          next ? current.filter((id) => id !== userId) : [userId, ...current],
        )
        setError("\u0630\u062e\u06cc\u0631\u0647 \u0646\u0634\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.")
      } finally {
        setPending((current) => current.filter((id) => id !== userId))
      }
    },
    [ids, router, signedIn],
  )

  const value = useMemo(
    () => ({ ids, ready, has, isPending, toggle, error }),
    [ids, ready, has, isPending, toggle, error],
  )

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  )
}

export function useBookmarks(): BookmarksValue {
  return useContext(BookmarksContext)
}
