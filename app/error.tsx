"use client"

/**
 * Route error boundary.
 *
 * Server components that throw - a timeout, a 500, a rate limit hit during
 * render - land here. The distinction that matters to a person is whether
 * waiting helps, so a 429 gets its own message: everything else is "try
 * again", but a rate limit is "try again in a minute".
 *
 * The digest is the only handle on the server-side log, so it is printed
 * rather than hidden.
 */

import { useEffect } from "react"
import Link from "next/link"

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const rateLimited = /RATE_LIMITED|429|\u0634\u0644\u0648\u063a/.test(error.message)

  return (
    <main className="screen">
      <div className="empty glass" style={{ marginTop: 40 }}>
        <h1 className="hero__title hero__title--sm">
          {rateLimited ? "کمی صبر کنید" : "چیزی درست پیش نرفت"}
        </h1>

        <p style={{ marginTop: 8 }}>
          {rateLimited
            ? "درخواست‌های زیادی فرستاده شده است. یک دقیقه دیگر دوباره تلاش کنید."
            : "این صفحه بارگزاری نشد. ممکن است موقتی باشد."}
        </p>

        <div className="gate__actions">
          <button
            type="button"
            className="modal__btn modal__btn--primary"
            onClick={reset}
          >
            تلاش دوباره
          </button>
          <Link className="modal__btn modal__btn--ghost" href="/discover">
            رفتن به جستجو
          </Link>
        </div>

        {error.digest ? (
          <p className="panel__hint" style={{ marginTop: 14 }} dir="ltr">
            {"شناسه خطا: " + error.digest}
          </p>
        ) : null}
      </div>
    </main>
  )
}
