import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getBusiness } from "@/lib/api/businesses"
import type { BusinessContact } from "@/lib/api/business-types"
import { businessLocationLabel, RELEVANCE_FIELDS } from "@/lib/business-search"
import BusinessBookmarkButton from "@/components/BusinessBookmarkButton"
import { BusinessBookmarkStatus } from "@/components/BusinessBookmarksProvider"
import UIIcon from "@/components/UIIcon"
import BusinessCover from "@/components/BusinessCover"
import RelatedBusinessPerson from "@/components/RelatedBusinessPerson"
import "@/app/business-presentation.css"

function contactHref(contact: BusinessContact): string | null {
  const value = contact.value.trim()
  if (contact.type === "phone") {
    const number = value.replace(/[\s().-]/g, "")
    return /^\+?\d{3,20}$/.test(number) ? "tel:" + number : null
  }
  if (contact.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "mailto:" + encodeURIComponent(value) : null
  if (contact.type === "url") {
    try {
      const url = new URL(value)
      return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null
    } catch { return null }
  }
  return null
}

function contactIcon(type: BusinessContact["type"]) {
  if (type === "phone") return "phone" as const
  if (type === "email") return "mail" as const
  if (type === "url") return "globe" as const
  return "info" as const
}

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string | string[] }> }

function searchReturnHref(value: string | string[] | undefined, businessId: number): string {
  if (typeof value !== "string") return "/discover"
  try {
    // Accept only our search route: a supplied return target must never become
    // an external link. The result anchor returns readers to the clicked row.
    const url = new URL(value, "https://hoviat.invalid")
    if (url.origin !== "https://hoviat.invalid" || url.pathname !== "/discover") return "/discover"
    return url.pathname + url.search + `#business-${businessId}`
  } catch { return "/discover" }
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id < 1) return { title: "کسب‌وکار پیدا نشد | هویت" }
  try { const business = await getBusiness(id); return { title: business ? business.name + " | هویت" : "کسب‌وکار پیدا نشد | هویت" } } catch { return { title: "کسب‌وکار | هویت" } }
}

export default async function BusinessPage({ params, searchParams }: Props) {
  const id = Number((await params).id)
  if (!Number.isSafeInteger(id) || id < 1) notFound()
  const business = await getBusiness(id)
  if (!business) notFound()
  const backHref = searchReturnHref((await searchParams).returnTo, business.id)
  const location = businessLocationLabel(business)
  const categories = [...new Map(business.categories.map((entry) => [entry.category_id, entry])).values()]
  const primary = categories.find((entry) => entry.is_primary) || categories[0]
  const contacts = [...business.contacts].sort((a, b) => a.display_order - b.display_order)
  const phone = contacts.find((contact) => contact.type === "phone" && contactHref(contact))
  const updated = new Date(business.updated_at)
  const updatedLabel = Number.isNaN(updated.getTime()) ? null : new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(updated)
  const hasCoordinates = business.latitude !== null && business.longitude !== null && Number.isFinite(business.latitude) && Number.isFinite(business.longitude) && Math.abs(business.latitude) <= 90 && Math.abs(business.longitude) <= 180
  const mapHref = hasCoordinates ? `https://www.openstreetmap.org/?mlat=${business.latitude}&mlon=${business.longitude}#map=16/${business.latitude}/${business.longitude}` : null
  return <main className="screen business-screen bp-detail-screen">
    <Link href={backHref} className="bp-back"><UIIcon name="arrow" size={17} />بازگشت به جستجو</Link>
    <header className="bp-detail-hero glass">
      <div className="bp-detail-hero__identity">
        <p className="bp-eyebrow"><UIIcon name="briefcase" size={16} />کسب‌وکارها و خدمات</p>
        <h1>{business.name}</h1>
        {location && <p className="bp-location"><UIIcon name="map" size={18} /><span dir="auto">{location}</span></p>}
        <div className="bp-detail-hero__save"><BusinessBookmarkButton business={business} /></div>
        <div className="bp-detail-hero__actions">
          <a href={phone ? contactHref(phone)! : "#business-contacts"} className="bp-action bp-action--primary"><UIIcon name={phone ? "phone" : "globe"} size={19} />{phone ? "تماس با کسب‌وکار" : "راه‌های ارتباط"}</a>
          {phone && <a href="#business-contacts" className="bp-action bp-action--secondary">همهٔ راه‌های ارتباط<UIIcon name="chevron" className="bp-chevron" size={17} /></a>}
        </div>
      </div>
      <div className="bp-category-art bp-category-art--hero" aria-hidden="true">
        <BusinessCover url={business.cover_image_url} hero />
      </div>
    </header>
    <BusinessBookmarkStatus />
    <RelatedBusinessPerson key={business.id} businessId={business.id} />
    <dl className="bp-summary glass" aria-label="در یک نگاه">
      <div><span className="bp-summary__icon"><UIIcon name="tag" size={22} /></span><dt>دسته‌بندی</dt><dd>{primary?.category.name || "ثبت نشده"}</dd></div>
      <div><span className="bp-summary__icon"><UIIcon name="phone" size={22} /></span><dt>راه‌های ارتباط عمومی</dt><dd>{contacts.length.toLocaleString("fa-IR")} راه ارتباط</dd></div>
      {updatedLabel && <div><span className="bp-summary__icon"><UIIcon name="calendar" size={22} /></span><dt>آخرین به‌روزرسانی</dt><dd>{updatedLabel}</dd></div>}
    </dl>
    <section className="bp-section glass" aria-labelledby="business-about-heading">
      <h2 id="business-about-heading"><UIIcon name="briefcase" size={22} />دربارهٔ کسب‌وکار</h2>
      <p className="bp-bio">{business.description || "هنوز توضیحی برای این کسب‌وکار ثبت نشده است."}</p>
      {categories.length > 0 && <ul className="bp-tags" aria-label="دسته‌بندی‌ها">{categories.map((entry) => <li key={entry.category_id} className="bp-tag"><Link href={"/discover?category=" + entry.category_id + "&country_code=" + (business.country_code || "all")}><UIIcon name="tag" size={14} />{entry.category.name}</Link></li>)}</ul>}
    </section>
    <section className="bp-section glass" aria-labelledby="business-persian-heading">
      <h2 id="business-persian-heading"><UIIcon name="users" size={22} />ارتباط با جامعهٔ فارسی‌زبان</h2>
      <dl className="bp-relevance">{RELEVANCE_FIELDS.map(({ key, label }) => <div key={key}><dt>{label}</dt><dd className={business[key] === true ? "bp-relevance__yes" : business[key] === null ? "bp-relevance__unknown" : "bp-relevance__no"} title={business[key] === true ? "بله" : business[key] === false ? "خیر" : "نامشخص"}><span aria-hidden="true">{business[key] === true ? "✓" : business[key] === false ? "✕" : "?"}</span><span className="sr-only">{business[key] === true ? "بله" : business[key] === false ? "خیر" : "نامشخص"}</span></dd></div>)}</dl>
    </section>
    {(business.address || business.postal_code || mapHref) && <section className="bp-section bp-address glass" aria-labelledby="business-address-heading">
      <div><h2 id="business-address-heading"><UIIcon name="map" size={22} />نشانی</h2><p dir="auto">{[business.address, business.postal_code, location].filter(Boolean).join("، ")}</p></div>
      {mapHref && <a href={mapHref} target="_blank" rel="noopener noreferrer" className="bp-action bp-action--secondary"><UIIcon name="map" size={19} />نمایش موقعیت روی نقشه<UIIcon name="external" size={15} /></a>}
    </section>}
    <section id="business-contacts" className="bp-section glass" aria-labelledby="business-contacts-heading">
      <h2 id="business-contacts-heading"><UIIcon name="phone" size={22} />راه‌های ارتباط</h2>
      {contacts.length ? <ul className="bp-contacts">{contacts.map((contact, index) => {
        const href = contactHref(contact)
        const content = <><span className="bp-contact__icon"><UIIcon name={contactIcon(contact.type)} size={23} /></span><span className="bp-contact__content"><span className="bp-contact__title">{contact.title}</span><bdi className="bp-contact__value" dir="auto">{contact.value}</bdi>{contact.platform && <span className="bp-contact__platform">{contact.platform}</span>}</span>{href && <UIIcon name={contact.type === "url" ? "external" : "chevron"} className={contact.type === "url" ? undefined : "bp-chevron"} size={18} />}</>
        return <li key={index}>{href ? <a href={href} className="bp-contact" rel="noopener noreferrer" target={contact.type === "url" ? "_blank" : undefined}>{content}</a> : <div className="bp-contact bp-contact--text">{content}</div>}</li>
      })}</ul> : <p className="bp-muted">راه تماس عمومی برای این کسب‌وکار ثبت نشده است.</p>}
    </section>
  </main>
}
