"use client"

import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { useBusinessBookmarks, BusinessBookmarkStatus } from "@/components/BusinessBookmarksProvider"
import BusinessList from "@/components/BusinessList"

export default function BusinessBookmarksPage() {
  const auth = useAuth()
  const bookmarks = useBusinessBookmarks()
  return <main className="screen business-screen business-bookmarks-page"><header className="hero"><p className="hero__eyebrow">فهرست خصوصی شما</p><h1 className="hero__title hero__title--sm">کسب‌وکارهای ذخیره‌شده</h1><p className="hero__sub">خدماتی که می‌خواهید دوباره به آن‌ها سر بزنید.</p></header>
    {!auth.ready || (auth.signedIn && !bookmarks.ready) ? <p role="status">در حال دریافت ذخیره‌ها…</p> : !auth.signedIn ? <div className="empty glass"><p>برای نگه داشتن کسب‌وکارها در فهرست شخصی، وارد حساب شوید.</p><Link href="/login?next=%2Fbusiness-bookmarks" className="business-primary">ورود به حساب</Link></div> : <><BusinessBookmarkStatus />{!bookmarks.error && (bookmarks.items.length ? <BusinessList businesses={bookmarks.items} /> : <div className="empty glass"><p>هنوز کسب‌وکاری ذخیره نکرده‌اید.</p><Link href="/discover" className="business-text-link">کشف کسب‌وکارها</Link></div>)}</>}
  </main>
}
