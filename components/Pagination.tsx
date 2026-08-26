/**
 * Link-based pagination.
 *
 * Deliberately anchors, not buttons. Every page of every search has to be a
 * real URL a crawler can follow, and a server component cannot hold click
 * handlers anyway. The window collapses to first / neighbours / last so many
 * pages still fit on a 320px screen.
 *
 * The chevrons are swapped for RTL. Direction-carrying glyphs are not mirrored
 * automatically, so in a right-to-left layout "previous" has to point right and
 * "next" left, or the arrows contradict the reading order.
 */

import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons"
import { faDigits } from "@/lib/date"

type PaginationProps = {
  page: number
  pages: number
  hrefForPage: (page: number) => string
}

function windowedPages(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 5) {
    return Array.from({ length: pages }, (_, index) => index + 1)
  }

  const items: Array<number | "gap"> = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pages - 1, page + 1)

  if (start > 2) items.push("gap")
  for (let value = start; value <= end; value++) items.push(value)
  if (end < pages - 1) items.push("gap")

  items.push(pages)
  return items
}

export default function Pagination({
  page,
  pages,
  hrefForPage,
}: PaginationProps) {
  if (pages <= 1) return null

  const items = windowedPages(page, pages)
  const prevDisabled = page <= 1
  const nextDisabled = page >= pages

  return (
    <nav className="pager" aria-label="صفحه‌بندی">
      <Link
        className={
          prevDisabled ? "pager__btn pager__btn--disabled" : "pager__btn"
        }
        href={hrefForPage(Math.max(1, page - 1))}
        aria-label="صفحه قبل"
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
      >
        {/* Points right: previous is to the right in RTL. */}
        <ChevronRightIcon />
      </Link>

      {items.map((item, index) =>
        item === "gap" ? (
          <span className="pager__gap" key={"gap-" + index} aria-hidden="true">
            &#8230;
          </span>
        ) : (
          <Link
            key={item}
            className={
              item === page ? "pager__page pager__page--active" : "pager__page"
            }
            href={hrefForPage(item)}
            aria-label={"صفحه " + faDigits(item)}
            aria-current={item === page ? "page" : undefined}
          >
            {faDigits(item)}
          </Link>
        ),
      )}

      <Link
        className={
          nextDisabled ? "pager__btn pager__btn--disabled" : "pager__btn"
        }
        href={hrefForPage(Math.min(pages, page + 1))}
        aria-label="صفحه بعد"
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
      >
        <ChevronLeftIcon />
      </Link>
    </nav>
  )
}
