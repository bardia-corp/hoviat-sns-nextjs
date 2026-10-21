/**
 * SEO surface for search.
 *
 * Two layers, on purpose:
 *
 * 1. /discover?country=Germany&occupation=Doctor is the canonical, fully
 *    dynamic URL. Any filter combination is expressible, server-rendered, and
 *    gets its own title and description.
 *
 * 2. /browse/[slug] is a curated set of high-intent landing pages, e.g.
 *    /browse/doctors-in-germany. These are statically generated at build time,
 *    each one a clean crawlable URL with hand-written copy, and each one links
 *    through to the canonical discover URL.
 *
 * Slugs stay Latin even though the site is Persian. A Persian slug is legal
 * but has to be percent-encoded, which turns a shareable URL into a wall of
 * hex. Titles, headings and descriptions are what search engines read for
 * language, and those are Persian.
 *
 * Layer 2 exists because occupation and country are free-text columns in the
 * backend with no controlled vocabulary. Inventing slugs for arbitrary
 * user-entered values on the frontend would be guessing; curating the handful
 * of searches we actually care about ranking for is not. Adding a search is a
 * one-line change to CURATED_SEARCHES below.
 */

import type { SearchQuery } from "./search"
import { faDigits } from "./date"

export const SITE_NAME = "هویت"

export type CuratedSearch = {
  slug: string
  heading: string
  occupation?: string
  country?: string
  title: string
  description: string
}

export const CURATED_SEARCHES: CuratedSearch[] = [
  {
    slug: "doctors-in-germany",
    heading: "پزشکان در آلمان",
    occupation: "پزشک",
    country: "آلمان",
    title: "پزشکان در آلمان",
    description:
      "فهرست پزشکان ساکن آلمان در هویت. جستجو بر اساس کشور، شغل و وضعیت عضویت.",
  },
  {
    slug: "doctors-in-iran",
    heading: "پزشکان در ایران",
    occupation: "پزشک",
    country: "ایران",
    title: "پزشکان در ایران",
    description:
      "پزشکان ساکن ایران را در هویت پیدا کنید؛ همراه با پروفایل عمومی و راه‌های ارتباط.",
  },
  {
    slug: "software-engineers-in-germany",
    heading: "مهندسان نرم‌افزار در آلمان",
    occupation: "مهندس نرم‌افزار",
    country: "آلمان",
    title: "مهندسان نرم‌افزار در آلمان",
    description:
      "مهندسان نرم‌افزار شاغل در آلمان را در هویت کشف کنید.",
  },
  {
    slug: "lawyers-in-turkey",
    heading: "وکیلان در ترکیه",
    occupation: "وکیل",
    country: "ترکیه",
    title: "وکیلان در ترکیه",
    description: "فهرست وکیلان ساکن ترکیه در هویت.",
  },
  {
    slug: "dentists-in-canada",
    heading: "دندانپزشکان در کانادا",
    occupation: "دندانپزشک",
    country: "کانادا",
    title: "دندانپزشکان در کانادا",
    description: "دندانپزشکان فعال در کانادا را در هویت ببینید.",
  },
  {
    slug: "translators-in-iran",
    heading: "مترجمان در ایران",
    occupation: "مترجم",
    country: "ایران",
    title: "مترجمان در ایران",
    description: "فهرست مترجمان ساکن ایران در هویت.",
  },
]

export function findCurated(slug: string): CuratedSearch | undefined {
  return CURATED_SEARCHES.find((item) => item.slug === slug)
}

/**
 * Human-readable label for a filter combination. Used for both the on-page
 * heading and the document title, so they never drift apart.
 */
export function describeQuery(query: SearchQuery): string {
  const { occupation, country, q } = query

  /* Persian needs no plural suffix here: "پزشک در آلمان" reads
     naturally as a category, and adding "ان" to a free-text occupation
     the backend never normalised would produce broken words. */
  if (occupation && country) return occupation + " در " + country
  if (occupation) return occupation
  if (country) return "افراد در " + country
  if (q) return "نتایج برای «" + q + "»"
  return "کشف افراد"
}

export function titleFor(query: SearchQuery): string {
  const base = describeQuery(query)
  const page =
    query.page && query.page > 1
      ? " – صفحه " + faDigits(query.page)
      : ""
  return base + page + " | " + SITE_NAME
}

export function descriptionFor(query: SearchQuery, total: number): string {
  return (
    faDigits(total) +
    " نتیجه برای " +
    describeQuery(query) +
    " در " +
    SITE_NAME +
    ". جستجوی افراد بر اساس نام، کشور، شغل و وضعیت عضویت."
  )
}
