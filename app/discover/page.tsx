import type { Metadata } from "next"
import { getBusinessCategories, getBusinessLocations, searchBusinesses } from "@/lib/api/businesses"
import { businessSearchHref, parseBusinessQuery } from "@/lib/business-search"
import type { RawParams } from "@/lib/search"
import { faDigits } from "@/lib/date"
import BusinessFilters from "@/components/BusinessFilters"
import BusinessList from "@/components/BusinessList"
import { BusinessBookmarkStatus } from "@/components/BusinessBookmarksProvider"
import Pagination from "@/components/Pagination"
import "../search-redesign.css"

export const metadata: Metadata = { title: "کشف کسب‌وکارها | هویت", description: "کسب‌وکارها و خدمات مرتبط با جامعهٔ فارسی‌زبان را در آلمان پیدا کنید." }

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const query = parseBusinessQuery(await searchParams)
  const outcomes = await Promise.allSettled([
    searchBusinesses(query), getBusinessLocations(), getBusinessCategories(query.country_code),
  ])
  const result = outcomes[0].status === "fulfilled" ? outcomes[0].value : null
  const locations = outcomes[1].status === "fulfilled" ? outcomes[1].value : []
  const categories = outcomes[2].status === "fulfilled" ? outcomes[2].value : []
  return <main className="screen business-screen discovery-page">
    <header className="hero search-hero"><p className="hero__eyebrow">کشف کسب‌وکارها</p>
      <h1 className="hero__title">خدمات مورد نیازتان را پیدا کنید</h1>
      <p className="hero__sub">خدمات فارسی‌زبان و کسب‌وکارهای ایرانی؛ در شهر شما.</p>
    </header>
    <BusinessFilters key={businessSearchHref(query)} query={query} locations={locations} categories={categories} />
    {(outcomes[1].status === "rejected" || outcomes[2].status === "rejected") && <p className="business-notice" role="status">پیشنهادهای شهر یا دسته‌بندی فعلاً در دسترس نیستند. می‌توانید با نام و موقعیت جستجو کنید.</p>}
    <BusinessBookmarkStatus />
    {result ? <>
      <div className="section"><h2 className="section__title">نتایج جستجو</h2><p className="section__count">{faDigits(result.meta.total)} کسب‌وکار</p></div>
      <BusinessList businesses={result.data} returnTo={businessSearchHref(query)} />
      <Pagination page={result.meta.page} pages={result.meta.pages} hrefForPage={(page) => businessSearchHref(query, { page })} />
    </> : <div className="business-notice" role="alert"><h2>دریافت کسب‌وکارها ممکن نشد</h2><p>ارتباط با سرویس برقرار نشد یا تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.</p><a className="business-text-link" href={businessSearchHref(query)}>تلاش دوباره</a></div>}
  </main>
}
