"use client"

/**
 * The interactive shell around the server-rendered results: search input,
 * quick occupation pills, filter dialog, and the applied-filter summary.
 *
 * Every change navigates. Search state is URL state, so this component owns no
 * results and no filtering logic - it only rewrites the address bar and lets
 * the server render the page again.
 *
 * Because the server has to re-render on every change, each navigation starts
 * the progress bar first. Without that the screen simply sits there looking
 * broken while the request is in flight.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { OCCUPATIONS } from "@/lib/people"
import {
  activeFilterCount,
  buildSearchHref,
  type SearchQuery,
} from "@/lib/search"
import FilterModal, { type Draft } from "./FilterModal"
import { FilterIcon, SearchIcon } from "./Icons"
import { useNavProgress } from "./NavProgress"
import { faDigits } from "@/lib/date"

/** A short list of high-traffic occupations offered as one-tap filters. */
const QUICK_OCCUPATIONS = OCCUPATIONS.slice(0, 6)

export default function DiscoverControls({ query }: { query: SearchQuery }) {
  const router = useRouter()
  const { start } = useNavProgress()
  const [text, setText] = useState(query.q ?? "")
  const [modalOpen, setModalOpen] = useState(false)

  // Keep the field in step with the URL, so back/forward and the applied-filter
  // chips do not leave a stale term in the box.
  useEffect(() => {
    setText(query.q ?? "")
  }, [query.q])

  function go(overrides: Partial<SearchQuery>) {
    // Any filter change returns to page 1: page 3 of the previous result set is
    // meaningless against a new one.
    start()
    router.push(buildSearchHref(query, { page: 1, ...overrides }))
  }

  const filterCount = activeFilterCount(query)

  const applied: Array<{ label: string; clear: Partial<SearchQuery> }> = []
  if (query.country) {
    applied.push({ label: query.country, clear: { country: undefined } })
  }
  if (query.occupation) {
    applied.push({ label: query.occupation, clear: { occupation: undefined } })
  }
  if (typeof query.is_registered === "boolean") {
    applied.push({
      label: query.is_registered ? "ثبت‌نام شده" : "ثبت‌نام نشده",
      clear: { is_registered: undefined },
    })
  }

  return (
    <>
      <form
        className="search glass"
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          go({ q: text.trim() || undefined })
        }}
      >
        <span className="search__icon">
          <SearchIcon />
        </span>

        <div className="search__field">
          <label className="sr-only" htmlFor="discover-search">
            جستجوی افراد
          </label>
          {/* type="text", not type="search": the native search input injects a
              clear button and results chrome that cannot be restyled. */}
          <input
            id="discover-search"
            className="search__input"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="نام، شغل، کشور یا معرفی"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>

        <button
          type="button"
          className="search__filter"
          onClick={() => setModalOpen(true)}
          aria-label="باز کردن فیلترها"
          aria-haspopup="dialog"
        >
          <FilterIcon />
          {filterCount > 0 ? (
            <span className="search__filter-count">{faDigits(filterCount)}</span>
          ) : null}
        </button>
      </form>

      <div className="pills">
        <button
          type="button"
          className={!query.occupation ? "pill pill--active" : "pill"}
          onClick={() => go({ occupation: undefined })}
        >
          همه
        </button>
        {QUICK_OCCUPATIONS.map((occupation) => {
          const active = query.occupation === occupation
          return (
            <button
              key={occupation}
              type="button"
              className={active ? "pill pill--active" : "pill"}
              aria-pressed={active}
              onClick={() =>
                go({ occupation: active ? undefined : occupation })
              }
            >
              {occupation}
            </button>
          )
        })}
      </div>

      {applied.length > 0 ? (
        <ul className="applied">
          {applied.map((item) => (
            <li className="applied__item" key={item.label}>
              {item.label}
              <Link
                className="applied__clear"
                href={buildSearchHref(query, { page: 1, ...item.clear })}
                aria-label={"حذف فیلتر " + item.label}
              >
                &#215;
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <FilterModal
        open={modalOpen}
        value={{
          country: query.country,
          occupation: query.occupation,
          is_registered: query.is_registered,
        }}
        onClose={() => setModalOpen(false)}
        onApply={(draft: Draft) => {
          setModalOpen(false)
          go(draft)
        }}
      />
    </>
  )
}
