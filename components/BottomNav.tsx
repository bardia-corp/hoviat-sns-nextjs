"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNavProgress } from "./NavProgress"
import UIIcon, { type UIIconName } from "./UIIcon"
import "./bottom-nav.css"

const TABS: { href: string; label: string; icon: UIIconName }[] = [
  { href: "/", label: "خانه", icon: "home" },
  { href: "/discover", label: "جست‌وجو", icon: "search" },
  { href: "/business-bookmarks", label: "ذخیره‌ها", icon: "bookmark" },
  { href: "/my-businesses", label: "کسب‌وکار من", icon: "store" },
  { href: "/profile", label: "پروفایل", icon: "user" },
]

export default function BottomNav() {
  const pathname = usePathname() || "/"
  const { target, pending, start, stop } = useNavProgress()
  const displayed = pending && target ? target.split("?")[0] : pathname
  const matches = (path: string, href: string) => href === "/" ? path === "/" : path === href || path.startsWith(href + "/") || (href === "/discover" && (path.startsWith("/browse") || path.startsWith("/businesses/")))
  const index = TABS.findIndex(({ href }) => matches(displayed, href))
  return <nav className="nav main-nav" aria-label="منوی اصلی"><div className="nav__inner glass" style={{ "--active-tab": index < 0 ? 0 : index } as React.CSSProperties}>
    {index >= 0 && <span className="main-nav__indicator" aria-hidden="true" />}
    {TABS.map(({ href, label, icon }) => {
      const active = matches(displayed, href)
      return <Link key={href} href={href} className={`main-nav__link${active ? " main-nav__link--active" : ""}`} aria-current={matches(pathname, href) ? "page" : undefined} onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        if (href === window.location.pathname + window.location.search) stop(); else start(href)
      }}>
        <span className="main-nav__icon"><UIIcon name={icon} size={24} /></span><span className="main-nav__label">{label}</span>
      </Link>
    })}
  </div></nav>
}
