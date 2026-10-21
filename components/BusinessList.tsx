import Link from "next/link"
import type { Business } from "@/lib/api/business-types"
import BusinessCard from "./BusinessCard"
import UIIcon from "./UIIcon"
import "@/app/business-presentation.css"

export default function BusinessList({ businesses, returnTo }: { businesses: Business[]; returnTo?: string }) {
  return businesses.length ? <div className="bp-results">{businesses.map((business) => <BusinessCard key={business.id} business={business} returnTo={returnTo} />)}</div> : <div className="bp-empty empty glass">
    <span className="bp-empty__icon"><UIIcon name="search" size={28} /></span>
    <p>کسب‌وکاری با این شرایط پیدا نشد.</p>
    <Link className="business-text-link" href="/discover">پاک کردن فیلترها و دیدن همهٔ کسب‌وکارها</Link>
  </div>
}
