"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { setBusinessBookmark } from "@/app/actions/business-bookmarks"
import type { Business } from "@/lib/api/business-types"
import { apiFetch, notifySessionExpired } from "@/lib/client-session"
import { useAuth } from "./AuthProvider"

type Store = {
  items: Business[]
  ready: boolean
  error: string | null
  pending: number[]
  refresh: () => void
  toggle: (business: Business) => Promise<void>
}
const Context = createContext<Store>({ items: [], ready: false, error: null, pending: [], refresh: () => {}, toggle: async () => {} })

export function BusinessBookmarksProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<Business[]>([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<number[]>([])
  const [revision, setRevision] = useState(0)
  const inFlight = useRef(new Set<number>())
  const generation = useRef(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    generation.current++
    const current = generation.current
    if (!auth.ready) return
    setError(null)
    if (!auth.signedIn) {
      setItems([])
      setPending([])
      inFlight.current.clear()
      setReady(true)
      return
    }
    setReady(false)
    apiFetch<Business[]>("/api/business-bookmarks").then((result) => {
      if (generation.current !== current) return
      if (result.ok) setItems(result.data ?? [])
      else setError(result.message ?? "ذخیره‌ها خوانده نشدند.")
      setReady(true)
    })
    return () => { generation.current++ }
  }, [auth.ready, auth.signedIn, revision])

  const toggle = useCallback(async (business: Business) => {
    const nextUrl = "/businesses/" + business.id
    if (!auth.signedIn) {
      router.push("/login?next=" + encodeURIComponent(nextUrl))
      return
    }
    if (!ready || error || inFlight.current.has(business.id)) return
    const current = generation.current
    const next = !items.some((item) => item.id === business.id)
    inFlight.current.add(business.id)
    setPending((ids) => [...ids, business.id])
    try {
      const result = await setBusinessBookmark(business.id, next)
      if (generation.current !== current) return
      if (result.ok) {
        setItems((previous) => result.bookmarked
          ? [business, ...previous.filter((item) => item.id !== business.id)]
          : previous.filter((item) => item.id !== business.id))
      } else if (result.reason === "auth") {
        notifySessionExpired({ next: nextUrl, redirect: true })
      } else setError(result.message ?? "ذخیره نشد. دوباره تلاش کنید.")
    } catch {
      if (generation.current === current) setError("ذخیره نشد. دوباره تلاش کنید.")
    } finally {
      inFlight.current.delete(business.id)
      setPending((ids) => ids.filter((id) => id !== business.id))
    }
  }, [auth.signedIn, ready, error, items, router])

  return <Context.Provider value={{ items, ready, error, pending, refresh, toggle }}>{children}</Context.Provider>
}

export const useBusinessBookmarks = () => useContext(Context)

export function BusinessBookmarkStatus() {
  const { error, refresh } = useBusinessBookmarks()
  return error ? <div className="business-notice" role="alert">{error} <button type="button" className="business-text-button" onClick={refresh}>تلاش دوباره</button></div> : null
}
