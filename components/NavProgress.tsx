"use client"

/**
 * Navigation progress.
 *
 * The problem this solves: with server-rendered routes, tapping a link starts
 * a network round trip and React keeps the current screen on screen until the
 * response arrives. A route-level loading.tsx does not help as much as it
 * looks like it should, because it only covers a segment actually being
 * entered, and it does nothing at all when only the query string changes,
 * which on the search page is most navigations. So the screen appears to
 * freeze.
 *
 * The fix has two halves. Here, a bar appears the instant a navigation starts
 * and the outgoing screen dims, so the wait is legible immediately. In the
 * search page, the results are wrapped in Suspense keyed by the query, so a
 * filter change re-suspends and shows skeletons.
 *
 * Starting the bar is automatic: a capture-phase click listener catches any
 * internal link, so every anchor in the app is covered without touching them
 * individually. Programmatic navigations call start() themselves.
 *
 * It stops when the URL actually changes, which is the only reliable signal
 * that the new route has been committed.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"

type NavValue = { pending: boolean; start: () => void; stop: () => void }

const NavContext = createContext<NavValue | null>(null)

/* Long waits are the reason this exists, but a stuck bar is worse than no
   bar, so it always clears itself. */
const SAFETY_TIMEOUT = 12000

export function NavProgressProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [pending, setPending] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const start = useCallback(() => setPending(true), [])
  const stop = useCallback(() => setPending(false), [])

  /* The URL changed, so the new route is committed. */
  useEffect(() => {
    setPending(false)
  }, [pathname, searchParams])

  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => setPending(false), SAFETY_TIMEOUT)
    return () => window.clearTimeout(timer)
  }, [pending])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      /* Let the browser handle modified clicks: they open tabs and windows
         rather than navigating this one. */
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const anchor = (event.target as HTMLElement | null)?.closest?.("a")
      if (!anchor) return

      const href = anchor.getAttribute("href")
      if (!href) return

      /* External, new tab, downloads, and in-page anchors are not route
         changes. */
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        /^https?:\/\//i.test(href)
      ) {
        return
      }

      if (anchor.getAttribute("aria-disabled") === "true") return

      /* Same URL means no navigation and therefore no completion event, so
         the bar would hang. */
      const current =
        pathname + (searchParams?.toString() ? "?" + searchParams : "")
      if (href === current || href === pathname) return

      setPending(true)
    }

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [pathname, searchParams])

  const value = useMemo<NavValue>(
    () => ({ pending, start, stop }),
    [pending, start, stop]
  )

  return (
    <NavContext.Provider value={value}>
      {pending ? (
        <div
          className="navbar-progress"
          role="progressbar"
          aria-label="در حال بارگذاری"
        >
          <div className="navbar-progress__bar" />
        </div>
      ) : null}
      <div className={pending ? "pending-veil" : undefined}>{children}</div>
    </NavContext.Provider>
  )
}

export function useNavProgress(): NavValue {
  const value = useContext(NavContext)
  /* Usable outside the provider so components stay independently testable. */
  return value ?? { pending: false, start: () => {}, stop: () => {} }
}
