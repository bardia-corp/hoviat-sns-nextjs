/**
 * 404. Reached by a wrong address, but also - and more often - by a profile
 * whose owner turned discovery off, because the API answers those two cases
 * identically on purpose. The copy says both, without implying the person
 * does not exist.
 */

import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "یافت نشد | هویت",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main className="screen">
      <div className="empty glass" style={{ marginTop: 40 }}>
        <h1 className="hero__title hero__title--sm">این صفحه پیدا نشد</h1>
        <p style={{ marginTop: 8 }}>
          نشانی اشتباه است، یا صاحب این پروفایل ترجیح داده در جستجو دیده نشود.
        </p>
        <div className="gate__actions">
          <Link className="modal__btn modal__btn--primary" href="/discover">
            جستجوی افراد
          </Link>
          <Link className="modal__btn modal__btn--ghost" href="/">
            صفحه اول
          </Link>
        </div>
      </div>
    </main>
  )
}
