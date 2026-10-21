import type { ReactNode } from "react"

export type UIIconName = "search" | "map" | "briefcase" | "chevron" | "close" | "filter" | "sort" | "check" | "arrow" | "home" | "bookmark" | "user" | "phone" | "mail" | "globe" | "store" | "calendar" | "tag" | "image" | "users" | "edit" | "camera" | "info" | "external"

const drawings: Record<UIIconName, ReactNode> = {
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  map: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="14" rx="3" /><path d="M8 7V4h8v3M3 12a20 20 0 0 0 18 0M10 12v3h4v-3" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  filter: <><path d="M4 6h16M4 12h16M4 18h16" /><path d="M8 3v6M16 9v6M10 15v6" /></>,
  sort: <><path d="M7 4v16m-3-3 3 3 3-3M13 5h7M13 10h5M13 15h3" /></>,
  check: <path d="m5 12 4.5 4.5L19 7" />,
  arrow: <path d="M20 12H4m6-6-6 6 6 6" />,
  home: <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  phone: <path d="m5 3 4 1 1 5-3 2a16 16 0 0 0 6 6l2-3 5 1 1 4c-1 4-8 2-12-2S3 6 5 3Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
  store: <><path d="m4 3-2 6a3 3 0 0 0 5 2 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 5-2l-2-6ZM4 12v9h16v-9M9 21v-6h6v6" /><path d="m8 3-1 6m5-6v6m4-6 1 6" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" /></>,
  tag: <><path d="M3 3h8l10 10-8 8L3 11Z" /><circle cx="7.5" cy="7.5" r="1" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 5-5 4 4 4-7 5 8" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" /></>,
  edit: <><path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14ZM3 21h18" /></>,
  camera: <><path d="M8 5 9 3h6l1 2h4a2 2 0 0 1 2 2v12H2V7a2 2 0 0 1 2-2Z" /><circle cx="12" cy="12" r="4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
  external: <><path d="M14 3h7v7m0-7L11 13M10 3H3v18h18v-7" /></>,
}

export default function UIIcon({ name, size = 22, strokeWidth = 1.8, className }: { name: UIIconName; size?: number; strokeWidth?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{drawings[name]}</svg>
}
