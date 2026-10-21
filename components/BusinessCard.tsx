import Link from "next/link"
import type { Business } from "@/lib/api/business-types"
import { businessLocationLabel, RELEVANCE_FIELDS } from "@/lib/business-search"
import BusinessBookmarkButton from "./BusinessBookmarkButton"
import UIIcon from "./UIIcon"
import BusinessCover from "./BusinessCover"

export default function BusinessCard({ business, returnTo }: { business: Business; returnTo?: string }) {
  const href = "/businesses/" + business.id + (returnTo ? "?" + new URLSearchParams({ returnTo }) : "")
  const location = businessLocationLabel(business)
  const categories = [...new Map(business.categories.map((entry) => [entry.category_id, entry])).values()]
  const primary = categories.find((entry) => entry.is_primary) || categories[0]
  const tags = [
    ...categories.filter((entry) => entry.category_id !== primary?.category_id).slice(0, 2).map((entry) => ({ key: String(entry.category_id), label: entry.category.name, category: true })),
    ...RELEVANCE_FIELDS.filter(({ key }) => business[key] === true).map(({ key, label }) => ({ key, label, category: false })),
  ]
  return <article id={`business-${business.id}`} className="bp-result glass" style={{ scrollMarginTop: "2rem" }}>
    <div className="bp-category-art">
      <BusinessCover url={business.cover_image_url} label={primary?.category.name || "کسب‌وکار و خدمات"} />
    </div>
    <div className="bp-result__body">
      <h2><Link href={href} className="bp-result__main-link">{business.name}</Link></h2>
      {location && <p className="bp-location"><UIIcon name="map" size={16} /><span dir="auto">{location}</span></p>}
      {business.description && <p className="bp-result__description">{business.description}</p>}
      {tags.length > 0 && <ul className="bp-tags" aria-label="دسته‌بندی و ویژگی‌ها">
        {tags.slice(0, 5).map((tag) => <li key={tag.key} className={tag.category ? "bp-tag" : "bp-tag bp-tag--relevance"}>{tag.label}</li>)}
        {tags.length > 5 && <li className="bp-tag bp-tag--more">{(tags.length - 5).toLocaleString("fa-IR")} ویژگی دیگر</li>}
      </ul>}
    </div>
    <div className="bp-result__actions">
      <Link href={href} className="bp-action bp-action--primary"><span>مشاهده و اطلاعات تماس</span><UIIcon name="chevron" className="bp-chevron" size={18} /></Link>
      <BusinessBookmarkButton business={business} />
    </div>
  </article>
}
