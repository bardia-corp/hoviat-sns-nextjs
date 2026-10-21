"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { RelatedBusinessPerson as Person } from "@/lib/api/business-types"
import { CONTACT_TEMPLATES, contactUrl, readSocialContacts } from "@/lib/guided-contacts"
import UIIcon from "./UIIcon"
import "./related-person.css"

// Only use the server's privacy-projected identity fields; the role is a heading,
// never a replacement for someone's display name.
const personName = (person: Person) => person.nickname?.trim()
  || [person.first_name?.trim(), person.last_name?.trim()].filter(Boolean).join(" ")
  || (person.username?.trim() ? "@" + person.username.trim().replace(/^@/, "") : "نام ثبت نشده")

export default function RelatedBusinessPerson({ businessId }: { businessId: number }) {
  const [person, setPerson] = useState<Person | null>(null)
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Person | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const read = async (signal?: AbortSignal): Promise<Person | null> => {
    const result = await fetch(`/api/businesses/${businessId}/related-person`, { cache: "no-store", signal })
    if (!result.ok) throw new Error("اطلاعات فرد مرتبط فعلاً در دسترس نیست.")
    return (await result.json()).data ?? null
  }
  useEffect(() => {
    const controller = new AbortController()
    read(controller.signal).then(setPerson).catch(() => {})
    return () => controller.abort()
    // businessId is the read boundary; this component is also keyed by ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])
  useEffect(() => {
    if (!open || !ref.current) return
    const element = ref.current
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const before = document.body.style.overflow
    document.body.style.overflow = "hidden"
    element.showModal()
    return () => { element.close(); document.body.style.overflow = before; trigger?.isConnected && trigger.focus({ preventScroll: true }) }
  }, [open])
  const show = async () => {
    setOpen(true); setDetail(null); setError(""); setBusy(true)
    try {
      // Recheck all three visibility gates whenever the dialog opens. Never
      // treat an earlier page read as continuing permission to show a person.
      const current = await read()
      setDetail(current); setPerson(current)
      if (!current) setError("اطلاعات این فرد دیگر برای نمایش عمومی در دسترس نیست.")
    } catch { setError("دریافت اطلاعات ممکن نشد. ببندید و دوباره تلاش کنید.") }
    finally { setBusy(false) }
  }
  const contacts = detail ? readSocialContacts(detail.social_links || []).values : null
  return <>
    {person && <section className="bp-section glass related-person-section"><h2><UIIcon name="user" size={22} />فرد مرتبط با کسب‌وکار</h2><button type="button" className="related-person-card" onClick={show}>
      <span className="related-person-avatar">{person.profile_url ? <img src={person.profile_url} alt="" /> : <UIIcon name="user" size={28} />}</span>
      <span><strong dir="auto">{personName(person)}</strong>{person.bio && <span className="related-person-preview-bio" dir="auto">{person.bio}</span>}<small>اطلاعات بیشتر و راه‌های ارتباط</small></span><UIIcon name="arrow" size={20} />
    </button></section>}
    <dialog ref={ref} className="related-person-dialog" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); setOpen(false) }} onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false)
    }}>
      <header><h2 id={titleId}>فرد مرتبط با کسب‌وکار</h2><button type="button" onClick={() => setOpen(false)} aria-label="بستن"><UIIcon name="close" /></button></header>
      <div className="related-person-dialog__body">
        {busy ? <p role="status">در حال دریافت اطلاعات…</p> : error ? <p role="alert">{error}</p> : detail && <>
          <span className="related-person-avatar related-person-avatar--large">{detail.profile_url ? <img src={detail.profile_url} alt="" /> : <UIIcon name="user" size={40} />}</span>
          <h3 dir="auto">{personName(detail)}</h3>{detail.bio && <p className="related-person-bio" dir="auto">{detail.bio}</p>}
          <div className="related-person-contacts">{CONTACT_TEMPLATES.map(({ key, label }) => contacts?.[key] ? <a key={key} href={contactUrl(key, contacts[key])} target={key === "phone" ? undefined : "_blank"} rel={key === "phone" ? undefined : "noopener noreferrer"}><UIIcon name={key === "phone" ? "phone" : "external"} size={18} /><span>{label}</span><bdi dir="ltr">{["phone", "whatsapp"].includes(key) ? "+" : ""}{contacts[key]}</bdi></a> : null)}</div>
        </>}
      </div><footer><button type="button" onClick={() => setOpen(false)}>بستن</button></footer>
    </dialog>
  </>
}
