"use client"

import { useState } from "react"
import UIIcon from "./UIIcon"

/** The URL comes from the public business DTO; missing/broken covers keep the icon art. */
export default function BusinessCover({ url, label, hero = false }: { url?: string | null; label?: string; hero?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  let source: string | null = null
  try {
    const parsed = new URL(url || "")
    if (["https:", "http:"].includes(parsed.protocol) && !parsed.username && !parsed.password) source = parsed.href
  } catch { /* Older listings have no cover image. */ }
  if (source && source !== failedUrl) return <>
    <img className="bp-cover-image" src={source} alt="" loading={hero ? "eager" : "lazy"} decoding="async" onError={() => setFailedUrl(source)} />
    {label && <span className="bp-cover-caption">{label}</span>}
  </>
  return <><span className="bp-category-art__orb" aria-hidden="true"><UIIcon name="store" size={hero ? 74 : 44} /></span>{label && <span className="bp-category-art__label">{label}</span>}</>
}
