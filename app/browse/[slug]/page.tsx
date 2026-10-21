import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { buildSearchHref } from "@/lib/search"
import { searchProfiles } from "@/lib/api/profiles"
import { SITE_NAME, findCurated } from "@/lib/seo"
import { faDigits } from "@/lib/date"
import ResultsList from "@/components/ResultsList"
import Pagination from "@/components/Pagination"

/**
 * Curated landing pages, e.g. /browse/doctors-in-germany.
 *
 * These exist because occupation and country are free-text columns in the
 * backend with no controlled vocabulary, so there is no safe way for the
 * frontend to mint a clean slug for an arbitrary user-entered value. Curating
 * the searches we actually want to rank for avoids inventing that vocabulary.
 * Results render on request so withdrawn personal fields are not kept in a
 * static page. The initial HTML remains crawlable.
 *
 * The slugs stay Latin while the content is Persian. A Persian slug is legal
 * but has to be percent-encoded, which turns a shareable link into hex.
 *
 * Adding a search is one entry in CURATED_SEARCHES.
 */

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

// These results contain personal fields whose visibility can be withdrawn.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const curated = findCurated(slug)
  if (!curated) return {}

  return {
    title: curated.title + " | " + SITE_NAME,
    description: curated.description,
    alternates: { canonical: "/browse/" + curated.slug },
  }
}

export default async function BrowsePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const curated = findCurated(slug)
  if (!curated) notFound()

  const requestedPage = Number((await searchParams).page)
  const page =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1

  const query = {
    country: curated.country,
    occupation: curated.occupation,
    page,
  }
  const { data, meta } = await searchProfiles(query)

  return (
    <main className="screen">
      <header className="hero">
        <p className="hero__eyebrow">{SITE_NAME}</p>
        <h1 className="hero__title hero__title--sm">{curated.heading}</h1>
        <p className="hero__sub">{curated.description}</p>
      </header>

      <section className="panel glass">
        <h2 className="panel__title">دقیق‌تر کردن این جستجو</h2>
        <p className="panel__hint">
          همین فیلترها را در صفحه جستجو باز کنید تا نام هم اضافه کنید یا
          وضعیت ثبت‌نام را تغییر دهید.
        </p>
        <ul className="link-list">
          <li>
            <Link
              className="link-row"
              href={buildSearchHref(query, { page: 1 })}
            >
              باز کردن در جستجو
              <span className="link-row__meta">
                {faDigits(meta.total)} نتیجه
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <div className="section">
        <h2 className="section__title">نتایج</h2>
        <p className="section__count">{faDigits(meta.total)} نفر</p>
      </div>

      <ResultsList
        people={data}
        emptyMessage="فعلاً کسی با این جستجو پیدا نشد."
      />

      <Pagination
        page={meta.page}
        pages={meta.pages}
        hrefForPage={(next) =>
          next === 1
            ? "/browse/" + curated.slug
            : "/browse/" + curated.slug + "?page=" + next
        }
      />
    </main>
  )
}
