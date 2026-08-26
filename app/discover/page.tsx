import type { Metadata } from "next"
import { Suspense } from "react"
import {
  buildSearchHref,
  hasExtraWords,
  parseSearchParams,
  type RawParams,
  type SearchQuery,
} from "@/lib/search"
import { searchProfiles } from "@/lib/api/profiles"
import { describeQuery, descriptionFor, titleFor } from "@/lib/seo"
import { faDigits } from "@/lib/date"
import DiscoverControls from "@/components/DiscoverControls"
import ResultsList from "@/components/ResultsList"
import Pagination from "@/components/Pagination"
import { CardListSkeleton } from "@/components/Skeleton"

/**
 * Discover: the search page, and the SEO-critical route.
 *
 * This is a server component. It reads the filters straight out of the URL and
 * renders the matching results into the initial HTML, so a crawler hitting
 * /discover?country=<country>&occupation=<occupation> sees the actual list
 * rather than an empty shell that fills in after hydration. The title and
 * description are generated from the same filters.
 *
 * The results sit inside Suspense, keyed by the query. That key is the whole
 * trick behind the loading state: changing a filter only changes the query
 * string, which is the same route, so Next reuses this page and loading.tsx
 * never fires. A new key makes React treat the boundary as new, so the
 * skeletons come back for every filter change instead of the screen sitting
 * frozen while the server works.
 *
 * The header renders outside the boundary, so it paints immediately.
 *
 * In Next 15 searchParams is a promise, hence the await.
 */

type PageProps = { searchParams: Promise<RawParams> }

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const query = parseSearchParams(await searchParams)
  const { meta } = await searchProfiles(query)

  return {
    title: titleFor(query),
    description: descriptionFor(query, meta.total),
    alternates: { canonical: buildSearchHref(query) },
    // Empty result pages are real pages, but there is nothing to index on
    // them and they can be generated endlessly from query strings.
    robots: meta.total === 0 ? { index: false, follow: true } : undefined,
  }
}

async function Results({ query }: { query: SearchQuery }) {
  const { data, meta } = await searchProfiles(query)

  return (
    <>
      <div className="section">
        <h2 className="section__title">نتایج</h2>
        {/* The total only. A "1-7 of 100" range restates what the pager
            already shows and reads as noise. */}
        <p className="section__count">{faDigits(meta.total)} نتیجه</p>
      </div>

      <ResultsList people={data} />

      <Pagination
        page={meta.page}
        pages={meta.pages}
        hrefForPage={(page) => buildSearchHref(query, { page })}
      />
    </>
  )
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const params = await searchParams
  const query = parseSearchParams(params)
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q
  const heading = describeQuery(query)

  return (
    <main className="screen">
      <header className="hero">
        <h1 className="hero__title hero__title--sm">{heading}</h1>
      </header>

      <DiscoverControls query={query} />

      {/* The server uses at most five words from q and ignores the rest
          silently. Saying so is better than showing results that quietly
          answer a shorter question than the one asked. */}
      {hasExtraWords(rawQuery) ? (
        <p className="panel__hint" style={{ marginBottom: 12 }}>
          جستجو فقط پنج واژه‌ی اول را در نظر می‌گیرد.
        </p>
      ) : null}

      <Suspense
        key={JSON.stringify(query)}
        fallback={<CardListSkeleton count={7} />}
      >
        <Results query={query} />
      </Suspense>
    </main>
  )
}
