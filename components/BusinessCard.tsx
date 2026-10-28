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
    ...categories.filter((entry) => entry.category_id !== primary?.category_id).map((entry) => ({ key: String(entry.category_id), label: entry.category.name, category: true })),
    ...RELEVANCE_FIELDS.filter(({ key }) => business[key] === true).map(({ key, label }) => ({ key, label, category: false })),
  ]
  return <article id={`business-${business.id}`} className="bp-result glass" style={{ scrollMarginTop: "2rem" }}>
    <div className="bp-category-art">
      <BusinessCover url={business.cover_image_url} />
    </div>
    <div className="bp-result__body">
      <h2><Link href={href} className="bp-result__main-link"><bdi dir="auto">{business.name}</bdi></Link></h2>
      <p className="bp-location"><UIIcon name="map" size={16} /><span>{[location, primary?.category.name].filter(Boolean).map((label, index) => <span key={index}>{index > 0 && " · "}<bdi dir="auto">{label}</bdi></span>)}</span></p>
      <ul className="bp-tags" aria-label="دسته‌بندی و ویژگی‌ها">
        {tags.slice(0, 1).map((tag) => <li key={tag.key} className={tag.category ? "bp-tag" : "bp-tag bp-tag--relevance"}>{tag.label}</li>)}
        {tags.length > 1 && <li className="bp-tag bp-tag--more" aria-label={`${tags.length - 1} ویژگی دیگر در جزئیات`}>+{(tags.length - 1).toLocaleString("fa-IR")}</li>}
      </ul>
    </div>
    <div className="bp-result__actions">
      <Link href={href} className="bp-action bp-action--primary"><span>مشاهده جزئیات</span><UIIcon name="chevron" className="bp-chevron" size={18} /></Link>
      <BusinessBookmarkButton business={business} />
    </div>
  </article>
}
