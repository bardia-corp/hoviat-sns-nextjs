"use client"

/**
 * Quick-look profile.
 *
 * Tapping a card opens this rather than navigating, because scanning several
 * people in a row is the common case and a full page load per person would be
 * slow. The "more" link is the escape hatch to the dedicated route, which is
 * also the crawlable, linkable one.
 *
 * Every field here can be null: the contract returns null for anything the
 * person keeps private, so absence is rendered explicitly instead of leaving
 * a blank row.
 */

import { useEffect } from "react"
import Link from "next/link"
import {
  displayName,
  joinedLabel,
  socialHandle,
  socialLabel,
  socialUrl,
} from "@/lib/people"
import Avatar from "./Avatar"
import { usePersonModal } from "./PersonModalProvider"
import { useBookmarks } from "./BookmarksProvider"
import { useAuth } from "./AuthProvider"
import { useRouter } from "next/navigation"
import {
  BookmarkFilledIcon,
  CloseIcon,
  ExternalIcon,
  PlusIcon,
  VerifiedIcon,
} from "./Icons"

export default function PersonModal() {
  const { person, close } = usePersonModal()
  const bookmarks = useBookmarks()
  const { signedIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!person) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close()
    }

    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [person, close])

  if (!person) return null

  const saved = bookmarks.has(person.user_id)
  const name = displayName(person)

  /* ltr marks the values the bidi algorithm must not reorder: a phone number
     is Latin digits with a leading plus, which would otherwise be moved to the
     wrong end of the line. */
  const rows: Array<{ label: string; value: string | null; ltr?: boolean }> = [
    { label: "شغل", value: person.occupation },
    { label: "کشور", value: person.country },
    { label: "عضویت از", value: joinedLabel(person) },
    { label: "تلفن", value: person.phone_number, ltr: true },
    { label: "واتس‌اپ", value: person.whatsapp_number, ltr: true },
  ]

  return (
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={name}
        tabIndex={-1}
      >
        <div className="modal__head">
          <h2 className="modal__title">پروفایل</h2>
          <button
            type="button"
            className="modal__close"
            onClick={close}
            aria-label="بستن پروفایل"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="person__head">
          <div className="person__avatar">
            {/* 96 to match the CSS box, so the browser does not scale it. */}
            <Avatar person={person} size={96} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h3 className="person__name">
              <span>{name}</span>
              {person.is_registered ? (
                <span className="card__badge" title="ثبت‌نام شده">
                  <VerifiedIcon size={16} />
                  <span className="sr-only">ثبت‌نام شده</span>
                </span>
              ) : null}
            </h3>
            <p className="person__role">
              {person.is_registered ? "ثبت‌نام شده" : "ثبت‌نام نشده"}
            </p>
          </div>
        </div>

        <p className="person__bio">
          {person.bio ?? "این کاربر معرفی عمومی ثبت نکرده است."}
        </p>

        {person.social_links && person.social_links.length > 0 ? (
          /* dir="ltr": platform names and handles are Latin; the Persian
             text around the list stays RTL. */
          <ul className="social" dir="ltr">
            {person.social_links.map((link) => (
              <li key={link.id ?? link.platform + link.url}>
                <a
                  className="social__link"
                  href={socialUrl(link)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  <span>{socialLabel(link)}</span>
                  <span className="social__handle">{socialHandle(link)}</span>
                  <ExternalIcon />
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <ul className="person__rows">
          {rows.map((row) => (
            <li className="person__row" key={row.label}>
              <span className="person__row-label">{row.label}</span>
              <span
                className={
                  row.value
                    ? "person__row-value"
                    : "person__row-value person__row-value--muted"
                }
                dir={row.value && row.ltr ? "ltr" : undefined}
              >
                {row.value ?? "خصوصی"}
              </span>
            </li>
          ))}
        </ul>

        <div className="modal__actions">
          <button
            type="button"
            className={
              saved
                ? "modal__btn modal__btn--primary"
                : "modal__btn modal__btn--ghost"
            }
            aria-pressed={saved}
            onClick={() =>
              signedIn
                ? bookmarks.toggle(person.user_id)
                : router.push("/login")
            }
          >
            {saved ? <BookmarkFilledIcon size={17} /> : <PlusIcon size={17} />}
            <span>{saved ? "ذخیره شد" : "ذخیره"}</span>
          </button>
          <Link
            className="modal__btn modal__btn--primary"
            href={"/profiles/" + person.user_id}
            onClick={close}
          >
            بیشتر
          </Link>
        </div>
      </div>
    </div>
  )
}
