"use client"

/**
 * Top bar, mirroring the bottom nav.
 *
 * Brand on one side (the same mark as the favicon) and, on the other, either a
 * "ورود" button or the signed-in user's avatar linking to their profile.
 *
 * The avatar comes from GET /api/account, so it is the real picture (or the
 * nickname initials) rather than a generic glyph.
 */

import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "./AuthProvider"
import { apiFetch } from "@/lib/client-session"
import type { Account } from "@/lib/api/types"
import Avatar from "./Avatar"

export default function Header() {
  const { signedIn } = useAuth()
  const [account, setAccount] = useState<Account | null>(null)

  useEffect(() => {
    if (!signedIn) {
      setAccount(null)
      return
    }

    let cancelled = false
    apiFetch<Account>("/api/account").then((result) => {
      if (cancelled) return
      if (result.ok && result.data) setAccount(result.data)
    })
    return () => {
      cancelled = true
    }
  }, [signedIn])

  return (
    <header className="header">
      <div className="header__inner glass--chrome">
        <Link href="/" className="header__brand" aria-label="هویت">
          <img src="/icon.svg" alt="" width={34} height={34} />
          <span className="header__wordmark">هویت</span>
        </Link>

        {signedIn ? (
          <Link href="/profile" className="header__profile" aria-label="پروفایل من">
            {account ? <Avatar person={account} size={40} /> : null}
          </Link>
        ) : (
          <Link href="/login" className="header__login">
            ورود
          </Link>
        )}
      </div>
    </header>
  )
}
