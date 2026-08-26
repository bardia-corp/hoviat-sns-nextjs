import Link from "next/link"
import { searchProfiles } from "@/lib/api/profiles"
import { COUNTRIES } from "@/lib/vocab"
import { CURATED_SEARCHES } from "@/lib/seo"
import { faDigits } from "@/lib/date"
import ResultsList from "@/components/ResultsList"
import BookmarkCount from "@/components/BookmarkCount"
import RequireAuth from "@/components/RequireAuth"

/**
 * Dashboard.
 *
 * Server-rendered, and everything on it comes from the public search endpoint:
 * the totals are meta.total from two filtered searches rather than a count
 * computed locally, because with a real API the client never holds the whole
 * dataset. All three requests share the 60-second cache, so a burst of
 * visitors costs the rate limit one round of calls, not one per person.
 *
 * The greeting is deliberately impersonal. Personalising it would mean reading
 * the session cookie here, which opts this route - and every route sharing the
 * layout - out of static rendering. The name is not worth that.
 *
 * The popular-searches list also does SEO work: it links crawlers from the
 * root into every curated landing page.
 */

export const metadata = {
  title: "خانه | هویت",
  description: "نمای کلی هویت، جستجوهای پرطرفدار و تازه‌ترین پروفایل‌ها.",
}

export default async function DashboardPage() {
  /* In parallel: three sequential awaits would make this the slowest screen
     in the app for no reason. */
  const [newest, everyone, registered] = await Promise.all([
    searchProfiles({ page: 1, size: 3 }),
    searchProfiles({ page: 1, size: 1 }),
    searchProfiles({ page: 1, size: 1, is_registered: true }),
  ])

  return (
    <main className="screen">
      <RequireAuth
        title="وارد حساب کاربری شوید"
        text="برای دسترسی به داشبورد، پروفایل و ذخیره‌های خود وارد حساب کاربری شوید. البته می‌توانید بدون ورود هم جست‌وجوی کاربران را ادامه دهید."
      >
        <header className="hero">
          <h1 className="hero__title">خوش آمدید</h1>
          <p className="hero__sub">
            افراد را بر اساس کشور و شغل پیدا کنید و هر کس را که برایتان مهم
            است در ذخیره‌ها نگه دارید.
          </p>
        </header>

        <div className="stats">
          <div className="stat glass">
            <p className="stat__value">{faDigits(everyone.meta.total)}</p>
            <p className="stat__label">پروفایل</p>
          </div>
          <div className="stat glass">
            <p className="stat__value">{faDigits(registered.meta.total)}</p>
            <p className="stat__label">ثبت‌نام شده</p>
          </div>
          <div className="stat glass">
            <p className="stat__value">
              <BookmarkCount />
            </p>
            <p className="stat__label">ذخیره شده</p>
          </div>
        </div>

        <section className="panel glass">
          <h2 className="panel__title">جستجوهای پرطرفدار</h2>
          <ul className="link-list">
            {CURATED_SEARCHES.map((item) => (
              <li key={item.slug}>
                <Link className="link-row" href={"/browse/" + item.slug}>
                  {item.heading}
                  <span className="link-row__meta">نمایش</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel glass">
          <h2 className="panel__title">جستجو بر اساس کشور</h2>
          <ul className="applied">
            {COUNTRIES.slice(0, 12).map((country) => (
              <li className="applied__item" key={country}>
                <Link href={"/discover?country=" + encodeURIComponent(country)}>
                  {country}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="section">
          <h2 className="section__title">تازه‌ترین پروفایل‌ها</h2>
          <Link className="section__count" href="/discover">
            همه
          </Link>
        </div>
        <ResultsList people={newest.data} />
      </RequireAuth>
    </main>
  )
}
