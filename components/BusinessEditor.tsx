"use client"

import Link from "next/link"
import SupportContact from "./SupportContact"
import BusinessCover from "./BusinessCover"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/AuthProvider"
import { apiFetch } from "@/lib/client-session"
import type {
  OwnedBusiness, OwnedBusinessList,
} from "@/lib/api/owned-business-types"

const STATUS: Record<OwnedBusiness["status"], string> = {
  draft: "پیش‌نویس", published: "منتشرشده", hidden: "پنهان", archived: "بایگانی",
}
function SignIn({ next }: { next: string }) {
  return <section className="owner-panel">
    <h2>کسب‌وکارتان را مدیریت کنید</h2>
    <p>برای دیدن کسب‌وکارهای اختصاص‌یافته به حساب خود وارد شوید.</p>
    <Link className="owner-button" href={`/login?next=${encodeURIComponent(next)}`}>ورود به حساب</Link>
  </section>
}

export function MyBusinessList({ page }: { page: number }) {
  const { ready, signedIn } = useAuth()
  const [result, setResult] = useState<OwnedBusinessList | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!ready || !signedIn) { setResult(null); return }
    let cancelled = false
    setLoading(true)
    setError("")
    apiFetch<OwnedBusinessList>(`/api/my-businesses?page=${page}`).then((response) => {
      if (cancelled) return
      if (response.ok && response.data) setResult(response.data)
      else { setResult(null); setError(response.message ?? "فهرست کسب‌وکارها دریافت نشد.") }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [ready, signedIn, page, retry])

  return <main className="owner-page">
    <header className="owner-heading">
      <Link href="/discover">بازگشت به جست‌وجو</Link>
      <h1>کسب‌وکارهای من</h1>
      <p>معرفی، نشانی و راه‌های تماس کسب‌وکار خود را به‌روز نگه دارید.</p>
    </header>
    {!ready ? <p role="status">در حال بررسی حساب…</p> : !signedIn ? <SignIn next="/my-businesses" />
      : loading ? <p role="status">در حال دریافت کسب‌وکارها…</p>
        : error ? <section className="owner-panel"><p role="alert">{error}</p><button className="owner-button" onClick={() => setRetry((value) => value + 1)}>تلاش دوباره</button></section>
          : result && result.items.length === 0 ? <section className="owner-panel">
            <h2>{page > 1 ? "این صفحه خالی است" : "هنوز کسب‌وکاری به حساب شما اختصاص ندارد"}</h2>
            <p>{page > 1 ? "به صفحه قبل یا ابتدای فهرست برگردید." : "پس از اختصاص کسب‌وکار توسط مدیریت، می‌توانید اطلاعاتش را از اینجا ویرایش کنید."}</p>
            {page === 1 && <><p>می‌خواهید کسب‌وکارتان را به هویت اضافه کنید؟ با تیم پشتیبانی تماس بگیرید.</p><SupportContact /></>}
            {page > 1 && <Link href="/my-businesses">ابتدای فهرست</Link>}
          </section> : <>
            <div className="owner-cards">{result?.items.map((business) => <article className="owner-panel owner-business-row" key={business.id}>
              <Link href={`/my-businesses/${business.id}`} className="owner-business-cover" aria-label={`مدیریت ${business.name}`}><BusinessCover url={business.cover_image_url} /></Link>
              <div className="owner-business-row__body">
              <span className="owner-badge">{STATUS[business.status]}</span>
              <h2><Link className="owner-business-main-link" href={`/my-businesses/${business.id}`}>{business.name}</Link></h2>
              <p>{[business.city, business.state, business.country_code].filter(Boolean).join("، ") || "نشانی وارد نشده است"}</p>
              <p className="owner-bio">{business.description || "هنوز معرفی کسب‌وکار نوشته نشده است."}</p>
              </div>
              <Link className="owner-button" href={`/my-businesses/${business.id}`}>ویرایش اطلاعات</Link>
            </article>)}</div>
            {result && result.meta.pages > 1 && <nav className="owner-pagination" aria-label="صفحه‌های کسب‌وکارهای من">
              {page > 1 && <Link href={`/my-businesses?page=${page - 1}`}>صفحه قبل</Link>}
              <span>صفحه {page.toLocaleString("fa-IR")} از {result.meta.pages.toLocaleString("fa-IR")}</span>
              {page < result.meta.pages && <Link href={`/my-businesses?page=${page + 1}`}>صفحه بعد</Link>}
            </nav>}
          </>}
  </main>
}

export { default } from "./OwnedBusinessEditor"
