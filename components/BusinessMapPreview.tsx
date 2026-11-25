"use client"

import { useEffect, useRef, useState } from "react"

export default function BusinessMapPreview({ src, name }: { src: string; name: string }) {
  const container = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [started, setStarted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const target = container.current
    if (!target) return
    if (!("IntersectionObserver" in window)) { setStarted(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setStarted(true); observer.disconnect() }
    }, { rootMargin: "200px" })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started || loaded || failed) return
    timer.current = setTimeout(() => setFailed(true), 15000)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [started, loaded, failed])

  if (failed) return null
  return <div ref={container} className={`bp-map-preview${loaded ? " bp-map-preview--loaded" : ""}`} aria-hidden={!loaded}>
    {started && <iframe
      src={src}
      title={`موقعیت ${name} در Google Maps`}
      width="640"
      height="220"
      referrerPolicy="strict-origin-when-cross-origin"
      tabIndex={loaded ? 0 : -1}
      // Cross-origin iframe load events also fire for some error pages. This
      // hides stalled loads, not errors rendered inside Google's document.
      onLoad={() => { if (timer.current) clearTimeout(timer.current); setLoaded(true) }}
      onError={() => setFailed(true)}
    />}
  </div>
}
