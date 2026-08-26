"use client"

/**
 * Shown in place of a screen that needs a session.
 *
 * An invitation rather than a redirect: being bounced to a login form without
 * explanation is disorienting, and search still works, so there is always
 * somewhere useful to go instead.
 */

import Link from "next/link"

export default function LoginGate({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <div className="gate glass">
      <div className="gate__mark icon-btn--orb" aria-hidden="true">
        H
      </div>
      <h2 className="gate__title">{title}</h2>
      <p className="gate__text">{text}</p>
      <div className="gate__actions">
        <Link className="modal__btn modal__btn--primary" href="/login">
          ورود با تلگرام
        </Link>
        <Link className="modal__btn modal__btn--ghost" href="/discover">
          ادامه جستجو
        </Link>
      </div>
    </div>
  )
}
