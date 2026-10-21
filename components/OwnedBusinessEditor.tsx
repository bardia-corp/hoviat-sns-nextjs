"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useAuth } from "./AuthProvider"
import EditorDialog from "./EditorDialog"
import GuidedContactFields from "./GuidedContactFields"
import UIIcon from "./UIIcon"
import { apiFetch } from "@/lib/client-session"
import { BUSINESS_CONTACT_TEMPLATES, EMPTY_CONTACTS, readBusinessContacts, validateContacts, writeBusinessContacts, type ContactKind, type ContactValues } from "@/lib/guided-contacts"
import type { BusinessLocation } from "@/lib/api/business-types"
import type { OwnedBusiness, OwnedBusinessPatch } from "@/lib/api/owned-business-types"

type Editor = "identity" | "location" | "contacts" | "person" | null
type Location = { address: string; postal_code: string; city: string; state: string; country_code: string; latitude: string; longitude: string }
const EMPTY_LOCATION: Location = { address: "", postal_code: "", city: "", state: "", country_code: "", latitude: "", longitude: "" }
const STATUS: Record<OwnedBusiness["status"], string> = { draft: "پیش‌نویس", published: "منتشرشده", hidden: "پنهان", archived: "بایگانی" }

export default function OwnedBusinessEditor({ id }: { id: string }) {
  const { ready, signedIn } = useAuth()
  const [business, setBusiness] = useState<OwnedBusiness | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [missing, setMissing] = useState(false)
  const [retry, setRetry] = useState(0)
  const [editor, setEditor] = useState<Editor>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [stale, setStale] = useState(false)
  const [identity, setIdentity] = useState({ name: "", description: "" })
  const [location, setLocation] = useState<Location>(EMPTY_LOCATION)
  const [contactDraft, setContactDraft] = useState<ContactValues>({ ...EMPTY_CONTACTS })
  const [contactVisibility, setContactVisibility] = useState<Record<ContactKind, boolean>>(() => Object.fromEntries(Object.keys(EMPTY_CONTACTS).map((key) => [key, false])) as Record<ContactKind, boolean>)
  const [catalogue, setCatalogue] = useState<BusinessLocation[]>([])
  const [catalogueError, setCatalogueError] = useState("")
  const [showPerson, setShowPerson] = useState(false)

  useEffect(() => {
    if (!ready || !signedIn) { setBusiness(null); return }
    let cancelled = false
    setLoading(true); setLoadError(""); setBusiness(null)
    apiFetch<OwnedBusiness>(`/api/my-businesses/${encodeURIComponent(id)}`).then((response) => {
      if (cancelled) return
      if (response.ok && response.data) { setBusiness(response.data); setMissing(false); setStale(false) }
      else { setMissing(response.status === 404); setLoadError(response.message ?? "اطلاعات کسب‌وکار دریافت نشد.") }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [ready, signedIn, id, retry])

  useEffect(() => {
    if (editor !== "location") return
    let cancelled = false
    setCatalogueError("")
    apiFetch<BusinessLocation[]>("/api/my-businesses/locations").then((response) => {
      if (cancelled) return
      if (response.ok && response.data) setCatalogue(response.data)
      else setCatalogueError("فهرست شهرها دریافت نشد. فرم را ببندید و دوباره تلاش کنید.")
    }).catch(() => { if (!cancelled) setCatalogueError("فهرست شهرها دریافت نشد.") })
    return () => { cancelled = true }
  }, [editor])

  const open = useCallback((next: Exclude<Editor, null>) => {
    if (!business) return
    setIdentity({ name: business.name, description: business.description ?? "" })
    setLocation({ address: business.address ?? "", postal_code: business.postal_code ?? "", city: business.city ?? "", state: business.state ?? "", country_code: business.country_code ?? "", latitude: business.latitude == null ? "" : String(business.latitude), longitude: business.longitude == null ? "" : String(business.longitude) })
    const contacts = readBusinessContacts(business.contacts)
    setContactDraft(contacts.values); setContactVisibility(contacts.visible)
    setShowPerson(business.owner_show_profile); setError(""); setEditor(next)
  }, [business])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!business || saving || stale) return
    const body: OwnedBusinessPatch = { expected_updated_at: business.updated_at }
    const optional = (value: string) => value.trim() || null
    if (editor === "identity") {
      if (!identity.name.trim()) { setError("نام کسب‌وکار را وارد کنید."); return }
      body.name = identity.name.trim(); body.description = optional(identity.description)
    } else if (editor === "location") {
      if (!catalogue.length || catalogueError) { setError("ابتدا فهرست شهرها باید دریافت شود."); return }
      const region = catalogue.find((country) => country.country_code === location.country_code)?.states.find((state) => state.state === location.state)
      if (location.city && !region?.cities.some((city) => city.city === location.city)) { setError("شهر را از فهرست انتخاب کنید."); return }
      const country = location.country_code.trim().toUpperCase()
      const lat = location.latitude.trim() === "" ? null : Number(location.latitude)
      const lon = location.longitude.trim() === "" ? null : Number(location.longitude)
      if (country && !/^[A-Z]{2}$/.test(country)) { setError("کد کشور باید دو حرف لاتین باشد؛ مثلاً DE."); return }
      if ((lat === null) !== (lon === null) || (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90)) || (lon !== null && (!Number.isFinite(lon) || Math.abs(lon) > 180))) { setError("مختصات را به‌صورت جفت معتبر وارد کنید یا هر دو را خالی بگذارید."); return }
      Object.assign(body, { address: optional(location.address), postal_code: optional(location.postal_code), city: optional(location.city), state: optional(location.state), country_code: country || null, latitude: lat, longitude: lon })
    } else if (editor === "contacts") {
      const checked = validateContacts(contactDraft, true)
      if (checked.error) { setError(checked.error); return }
      body.contacts = writeBusinessContacts(business.contacts, checked.values, contactVisibility)
    } else if (editor === "person") body.owner_show_profile = showPerson
    setSaving(true); setError(""); setNotice("")
    try {
      const response = await apiFetch<OwnedBusiness>(`/api/my-businesses/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (response.ok && response.data) { setBusiness(response.data); setEditor(null); setNotice("تغییرات کسب‌وکار ذخیره شد.") }
      else { if (response.status === 409) setStale(true); if (response.status === 404) { setMissing(true); setEditor(null); setBusiness(null) }; setError(response.message ?? "اطلاعات ذخیره نشد.") }
    } catch { setError("ارتباط برقرار نشد. دوباره تلاش کنید.") }
    finally { setSaving(false) }
  }

  const sectionButton = (section: Exclude<Editor, null>) => <button type="button" className="owner-edit-pill" disabled={stale} onClick={() => open(section)}><UIIcon name="edit" size={17} />ویرایش</button>
  const relatedAllowed = business?.admin_allows_owner_visibility === true
  const currentContacts = business ? readBusinessContacts(business.contacts) : null
  const locationStates = catalogue.find((country) => country.country_code === location.country_code)?.states ?? []
  const locationCities = locationStates.find((region) => region.state === location.state)?.cities ?? []
  return <main className="owner-page owner-manage-page">
    <header className="owner-heading"><Link href="/my-businesses">کسب‌وکارهای من</Link><h1>{business?.name ?? "مدیریت کسب‌وکار"}</h1><p>اطلاعات و راه‌های ارتباط کسب‌وکار را به‌روز نگه دارید.</p></header>
    {!ready ? <p role="status">در حال بررسی حساب…</p> : !signedIn ? <section className="owner-panel"><h2>وارد حساب شوید</h2><Link className="owner-button" href={`/login?next=${encodeURIComponent(`/my-businesses/${id}`)}`}>ورود</Link></section>
      : loading ? <p role="status">در حال دریافت اطلاعات…</p>
        : missing || !business ? <section className="owner-panel"><p role="alert">{loadError || error || "کسب‌وکار پیدا نشد یا به این حساب اختصاص ندارد."}</p>{!missing && <button type="button" className="owner-button" onClick={() => setRetry((value) => value + 1)}>تلاش دوباره</button>}</section>
          : <>
            {notice && <p className="owner-notice" role="status">{notice}</p>}
            {loadError && <p className="owner-alert" role="alert">{loadError}</p>}
            {stale && <div className="owner-alert" role="alert"><p>اطلاعات این کسب‌وکار تغییر کرده است. نسخه تازه را بارگیری و دوباره ویرایش کنید.</p><button type="button" onClick={() => { setEditor(null); setRetry((value) => value + 1) }}>بارگیری نسخه تازه</button></div>}
            <section className="owner-panel"><div className="owner-section-heading"><h2><UIIcon name="store" size={23} />معرفی کسب‌وکار</h2>{sectionButton("identity")}</div><span className="owner-badge">{STATUS[business.status]}</span><h3>{business.name}</h3><p className="owner-bio">{business.description || "توضیحی درباره کسب‌وکار ثبت نشده است."}</p>{business.categories.length > 0 && <p className="owner-hint">{business.categories.map((item) => item.category?.name).filter(Boolean).join("، ")}</p>}</section>
            <section className="owner-panel"><div className="owner-section-heading"><h2><UIIcon name="map" size={23} />موقعیت</h2>{sectionButton("location")}</div><p>{[business.address, business.postal_code, business.city, business.state, business.country_code].filter(Boolean).join("، ") || "نشانی وارد نشده است."}</p></section>
            <section className="owner-panel"><div className="owner-section-heading"><h2><UIIcon name="phone" size={23} />راه‌های تماس کسب‌وکار</h2>{sectionButton("contacts")}</div><div className="owner-contact-summary">{BUSINESS_CONTACT_TEMPLATES.filter(({ key }) => currentContacts?.values[key]).map(({ key, label }) => <div key={key}><span>{label}</span><bdi>{key === "phone" || key === "whatsapp" ? "+" : key === "telegram" ? "@" : ""}{currentContacts!.values[key]}</bdi><small>{currentContacts!.visible[key] ? "عمومی" : "پنهان"}</small></div>)}</div>{currentContacts && !Object.values(currentContacts.values).some(Boolean) && <p className="owner-hint">راه‌های ارتباطی کسب‌وکار مثل تلفن، وب‌سایت یا تلگرام را اضافه کنید.</p>}</section>
            <section className="owner-panel"><div className="owner-section-heading"><h2><UIIcon name="user" size={23} />فرد مرتبط با کسب‌وکار</h2>{sectionButton("person")}</div><p>{business.owner_show_profile ? "اجازه نمایش اطلاعات پروفایل شما در این کسب‌وکار روشن است." : "نمایش اطلاعات پروفایل شما در این کسب‌وکار خاموش است."}</p>{!relatedAllowed && <p className="owner-hint">نمایش فرد مرتبط برای این کسب‌وکار هنوز توسط مدیریت فعال نشده است.</p>}<p className="owner-hint">نمایش اطلاعات به عمومی بودن پروفایل شخصی شما هم بستگی دارد.</p></section>
          </>}
    {editor && business && <EditorDialog title={editor === "identity" ? "معرفی کسب‌وکار" : editor === "location" ? "موقعیت کسب‌وکار" : editor === "contacts" ? "راه‌های تماس کسب‌وکار" : "نمایش فرد مرتبط"} busy={saving} error={error} onClose={() => setEditor(null)} onSubmit={save} saveLabel="ذخیره تغییرات" saveDisabled={stale}>
      {stale ? <><p className="editor-help">این نسخه قدیمی است. پیش از ادامه، اطلاعات تازه را دریافت کنید؛ تغییرات ذخیره‌نشده جایگزین می‌شود.</p><button type="button" className="owner-secondary" onClick={() => { setEditor(null); setRetry((value) => value + 1) }}>بارگیری نسخه تازه</button></> : <>
        {editor === "identity" && <><label>نام کسب‌وکار<input data-editor-focus required maxLength={300} value={identity.name} onChange={(event) => setIdentity({ ...identity, name: event.target.value })} /></label><label>معرفی و توضیحات<textarea rows={6} value={identity.description} onChange={(event) => setIdentity({ ...identity, description: event.target.value })} placeholder="درباره خدمات، تخصص و کسب‌وکار بنویسید…" /></label></>}
        {editor === "location" && <>
          {catalogueError && <p role="alert" className="editor-help">{catalogueError}</p>}
          {!catalogue.length && !catalogueError && <p role="status" className="editor-help">در حال دریافت شهرها…</p>}
          <div className="owner-grid">
            <label>کشور<select data-editor-focus value={location.country_code} onChange={(event) => setLocation({ ...location, country_code: event.target.value, state: "", city: "" })}><option value="">انتخاب کشور</option>{catalogue.map((country) => <option key={country.country_code} value={country.country_code ?? ""}>{country.country_code === "DE" ? "آلمان" : country.country_code}</option>)}</select></label>
            <label>ایالت<select value={location.state} onChange={(event) => setLocation({ ...location, state: event.target.value, city: "" })}><option value="">انتخاب ایالت</option>{locationStates.map((region) => <option key={region.state} value={region.state ?? ""}>{region.state}</option>)}</select></label>
            <label>شهر<select value={location.city} disabled={!location.state} onChange={(event) => setLocation({ ...location, city: event.target.value })}><option value="">انتخاب شهر</option>{locationCities.map((city) => <option key={city.city} value={city.city}>{city.city}</option>)}</select></label>
            <label>کد پستی<input dir="ltr" value={location.postal_code} onChange={(event) => setLocation({ ...location, postal_code: event.target.value })} /></label>
          </div>
          <label>نشانی<input value={location.address} onChange={(event) => setLocation({ ...location, address: event.target.value })} /></label>
          <p className="editor-help">اگر شهرتان در فهرست نیست، از پشتیبانی بخواهید آن را اضافه کند.</p>
          <details><summary>مختصات جغرافیایی (اختیاری)</summary><div className="owner-grid"><label>عرض جغرافیایی<input type="number" dir="ltr" step="any" min={-90} max={90} value={location.latitude} onChange={(event) => setLocation({ ...location, latitude: event.target.value })} /></label><label>طول جغرافیایی<input type="number" dir="ltr" step="any" min={-180} max={180} value={location.longitude} onChange={(event) => setLocation({ ...location, longitude: event.target.value })} /></label></div></details>
        </>}
        {editor === "contacts" && <><GuidedContactFields business values={contactDraft} onChange={(kind, value) => setContactDraft((current) => ({ ...current, [kind]: value }))} visibility={contactVisibility} onVisibility={(kind, visible) => setContactVisibility((current) => ({ ...current, [kind]: visible }))} />{currentContacts && currentContacts.preservedCount > 0 && <p className="editor-help">راه‌های ارتباطی دیگری که از قبل ثبت شده‌اند، با این فرم تغییری نمی‌کنند.</p>}</>}
        {editor === "person" && <><label className="editor-check"><input data-editor-focus type="checkbox" checked={showPerson} onChange={(event) => setShowPerson(event.target.checked)} />اجازه نمایش اطلاعات پروفایل من در این کسب‌وکار</label><p className="editor-help">این انتخاب مخصوص همین کسب‌وکار است و حریم خصوصی حساب شخصی شما را تغییر نمی‌دهد.</p>{!relatedAllowed && <p className="editor-help">مدیریت هنوز نمایش فرد مرتبط را برای این کسب‌وکار فعال نکرده است. می‌توانید انتخاب خود را ذخیره کنید.</p>}<p className="editor-help">نمایش عمومی فقط با اجازه مدیریت، اجازه شما و عمومی بودن پروفایل شخصی انجام می‌شود.</p><Link href="/profile">تنظیم حریم خصوصی پروفایل شخصی</Link></>}
      </>}
    </EditorDialog>}
  </main>
}
