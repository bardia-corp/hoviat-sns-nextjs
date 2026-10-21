"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import "./navigation-loading.css"

type NavValue = { pending: boolean; target: string | null; start: (href?: string) => void; stop: () => void }
const NavContext = createContext<NavValue | null>(null)

export function NavProgressProvider({ children, navigation }: { children: React.ReactNode; navigation?: React.ReactNode }) {
  const [pending, setPending] = useState(false)
  const [target, setTarget] = useState<string | null>(null)
  const pathname = usePathname() || "/"
  const params = useSearchParams()
  const current = pathname + (params?.toString() ? "?" + params.toString() : "")
  const stop = useCallback(() => { setPending(false); setTarget(null) }, [])
  const start = useCallback((href?: string) => { setTarget(href || null); setPending(true) }, [])

  useEffect(() => {
    if (!target || target === current) stop()
  }, [current, target, stop])
  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(stop, 15000)
    return () => window.clearTimeout(timer)
  }, [pending, target, stop])
  useEffect(() => {
    function click(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.("a")
      if (!anchor || anchor.target && anchor.target !== "_self" || anchor.hasAttribute("download") || anchor.getAttribute("aria-disabled") === "true") return
      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return
      const url = new URL(href, window.location.href)
      if (url.origin !== window.location.origin || !["http:", "https:"].includes(url.protocol)) return
      const destination = url.pathname + url.search
      if (destination !== current) start(destination)
    }
    document.addEventListener("click", click, true)
    window.addEventListener("popstate", stop)
    return () => { document.removeEventListener("click", click, true); window.removeEventListener("popstate", stop) }
  }, [current, start, stop])

  const switchingPage = pending && !!target && target.split("?")[0] !== pathname
  useEffect(() => {
    if (!switchingPage) return
    const before = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = before }
  }, [switchingPage])
  const value = useMemo(() => ({ pending, target, start, stop }), [pending, target, start, stop])
  return <NavContext.Provider value={value}>
    {pending && <div className="navbar-progress" role="progressbar" aria-label="در حال بارگذاری"><div className="navbar-progress__bar" /></div>}
    <div className={pending && !switchingPage ? "pending-veil" : undefined} inert={switchingPage || undefined} aria-hidden={switchingPage || undefined}>{children}</div>
    {switchingPage && <div className="nav-destination-loading" role="status" aria-live="polite"><div className="nav-destination-loading__content" key={target}>
      <p>در حال باز کردن صفحه…</p><div className="skeleton nav-loading-title" /><div className="skeleton nav-loading-subtitle" />
      {[0, 1, 2].map((item) => <div className="nav-loading-card" key={item}><div className="skeleton nav-loading-avatar" /><div><div className="skeleton" /><div className="skeleton" /></div></div>)}
    </div></div>}
    {navigation}
  </NavContext.Provider>
}

export function useNavProgress(): NavValue {
  return useContext(NavContext) ?? { pending: false, target: null, start: () => {}, stop: () => {} }
}
