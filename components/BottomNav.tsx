"use client"

/**
 * Bottom navigation.
 *
 * Real links, not tab state: each destination is its own route, so the nav has
 * to be anchors for back/forward, deep links and prefetching to work. The
 * raised blue sphere follows the active route via usePathname.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookmarkIcon, HomeIcon, SearchIcon, UserIcon } from "./Icons"

const TABS = [
  { href: "/", label: "خانه", Icon: HomeIcon },
  { href: "/discover", label: "جستجو", Icon: SearchIcon },
  { href: "/bookmarks", label: "ذخیره‌ها", Icon: BookmarkIcon },
  { href: "/profile", label: "پروفایل", Icon: UserIcon },
]

export default function BottomNav() {
  const pathname = usePathname() || "/"

  return (
    <nav className="nav" aria-label="منوی اصلی">
      <div className="nav__inner glass--chrome">
        {TABS.map(({ href, label, Icon }) => {
          // "/" must match exactly, or every route would light up the
          // dashboard tab. /browse pages belong to Discover.
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href ||
                pathname.startsWith(href + "/") ||
                (href === "/discover" && pathname.startsWith("/browse"))

          return (
            <Link
              key={href}
              href={href}
              className={active ? "nav__item nav__item--active" : "nav__item"}
              aria-current={active ? "page" : undefined}
            >
              <Icon />
              <span className="sr-only">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
