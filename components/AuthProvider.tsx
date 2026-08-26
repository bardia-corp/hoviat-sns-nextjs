"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  SESSION_EXPIRED_EVENT,
  apiFetch,
  type SessionExpiredDetail,
} from "@/lib/client-session"

/**
 * Whether there is a session - according to the server, never according to a
 * cookie this code wrote.
 *
 * The previous version kept a readable flag cookie and trusted it. It could
 * outlive the token it described, and when it did, the app told people to sign
 * in while continuing to behave as though they had; the only escape was
 * clearing cookies by hand. That was the bug. This is the fix:
 *
 *   - State comes from GET /api/session, which reads the httpOnly cookie.
 *     No upstream call, so it is cheap and cannot be rate limited.
 *   - Any 401 from any of our routes fires one event, and this provider drops
 *     to signed-out on it. The server has already deleted the cookie by then,
 *     so the two cannot disagree.
 *   - Returning to a tab re-checks, because a seven-day cookie can expire
 *     while the tab sits open.
 *
 * ready exists so a signed-in person does not see the sign-in invitation flash
 * during the first check.
 */

type AuthValue = {
  signedIn: boolean
  ready: boolean
  /** Called by the login screen once the route handler has set the cookie. */
  markSignedIn: () => void
  /** Ends the session everywhere. Safe from anywhere, any number of times. */
  expire: (options?: { redirect?: boolean; next?: string }) => void
  signOut: () => Promise<void>
  /** Re-asks the server. Rarely needed directly. */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue>({
  signedIn: false,
  ready: false,
  markSignedIn: () => {},
  expire: () => {},
  signOut: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [signedIn, setSignedIn] = useState(false)
  const [ready, setReady] = useState(false)

  /* Several components can discover the same dead session in one tick - three
     cards and a provider, say. This keeps that to a single redirect. */
  const expiring = useRef(false)

  const refresh = useCallback(async () => {
    const result = await apiFetch<never>("/api/session")

    /* A network failure says nothing about the session, so an unreachable dev
       server must not look like a sign-out. */
    if (result.status !== 0) {
      setSignedIn(result.signedIn)
      if (result.signedIn) expiring.current = false
    }

    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") refresh()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [refresh])

  const expire = useCallback(
    (options: { redirect?: boolean; next?: string } = {}) => {
      setSignedIn(false)
      setReady(true)

      if (expiring.current) return
      expiring.current = true

      /* Server components already rendered for a signed-in user are still held
         in the router cache; without this the next screen arrives looking
         signed in. */
      router.refresh()

      if (options.redirect) {
        const next = options.next
        router.push(
          "/login?expired=1" + (next ? "&next=" + encodeURIComponent(next) : ""),
        )
      }
    },
    [router],
  )

  /* The single channel through which a dead session is reported, from anywhere
     in the app - effects, actions, providers that do not nest. */
  useEffect(() => {
    function onExpired(event: Event) {
      const detail = (event as CustomEvent<SessionExpiredDetail>).detail ?? {}
      expire(detail)
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [expire])

  const markSignedIn = useCallback(() => {
    expiring.current = false
    setSignedIn(true)
    setReady(true)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/session", { method: "DELETE", cache: "no-store" })
    } finally {
      /* Cleared locally regardless. If the request failed the cookie may still
         be there, but staying signed in after someone asked to leave is worse
         than an inconsistency the next check corrects. */
      setSignedIn(false)
      expiring.current = false
      router.refresh()
    }
  }, [router])

  const value = useMemo(
    () => ({ signedIn, ready, markSignedIn, expire, signOut, refresh }),
    [signedIn, ready, markSignedIn, expire, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  return useContext(AuthContext)
}
