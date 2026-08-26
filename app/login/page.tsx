"use client"

/**
 * Login.
 *
 * Not an OAuth widget. The bot issues a one-time code, the person brings it
 * here, and this screen exchanges it. Three facts about that code shape the
 * whole design:
 *
 *   - It is exactly 32 characters from [A-Za-z0-9_-] and case-sensitive, so
 *     typing it is a mistake waiting to happen. The flow leads with a copy and
 *     paste, and the field never touches the casing.
 *   - It expires in roughly five minutes and works once. Those are two
 *     different failures with one error code, so the message names both.
 *   - Exchanges are limited to ten a minute, which is why the code is checked
 *     for length and alphabet here before a request is spent on it.
 *
 * The exchange itself happens in our own route handler, so the JWT goes
 * straight into an httpOnly cookie and never passes through this component.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { TelegramIcon } from "@/components/Icons"
import { useAuth } from "@/components/AuthProvider"

const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME ?? "hoviatloginbot"
const BOT_LINK = "https://t.me/" + BOT_USERNAME + "?start=login"
const CODE_LENGTH = 32
const CODE_PATTERN = /^[A-Za-z0-9_-]{32}$/

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { markSignedIn } = useAuth()

  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Where to land afterwards. Bookmarking while signed out sends people here
     with the profile they were looking at, so they are returned to it rather
     than dumped on their own profile page. */
  const next = params.get("next") ?? "/profile"

  /* Set when the app discovered a dead session and signed the user out. They
     did not choose to come here, so the screen says why rather than looking
     like an unexplained demand to log in again. */
  const expired = params.get("expired") === "1"

  const trimmed = code.trim()
  const valid = CODE_PATTERN.test(trimmed)
  const remaining = CODE_LENGTH - trimmed.length

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!valid || pending) return

    setPending(true)
    setError(null)

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      })
      const body = (await response.json()) as {
        ok?: boolean
        message?: string
      }

      if (!response.ok || !body.ok) {
        setError(
          body.message ??
            "\u0648\u0631\u0648\u062f \u0627\u0646\u062c\u0627\u0645 \u0646\u0634\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
        )
        setPending(false)
        return
      }

      /* The cookies are set by the response above; this only tells the UI. */
      markSignedIn()
      router.push(next)
      /* Server components rendered while signed out are still cached in the
         router, so without this the destination can arrive looking logged
         out. */
      router.refresh()
    } catch {
      setError(
        "\u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062f. \u0627\u062a\u0635\u0627\u0644 \u062e\u0648\u062f \u0631\u0627 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0646\u06cc\u062f.",
      )
      setPending(false)
    }
  }

  return (
    <main className="login">
      <div className="login__card glass">
        <div className="login__mark" aria-hidden="true">
          H
        </div>

        <h1 className="login__title">ورود به هویت</h1>
        <p className="login__sub">
          برای ورود به حساب کاربری، از طریق تلگرام یک کد یک‌بارمصرف دریافت کنید و
          آن را در اینجا وارد کنید.
        </p>

        <ol className="login__steps">
          <li>ربات هویت را در تلگرام باز کنید.</li>
          <li>کد یک‌بارمصرفی را که ربات برای شما ارسال می‌کند، کپی کنید.</li>
          <li>کد را در کادر زیر وارد کنید.</li>
        </ol>

        <a
          className="login__btn"
          href={BOT_LINK}
          target="_blank"
          rel="noopener noreferrer"
        >
          <TelegramIcon />
          باز کردن ربات تلگرام
        </a>

        <form className="login__form" onSubmit={submit}>
          <label className="login__label" htmlFor="login-code">
            کد ورود
          </label>

          {/* dir="ltr" because the code is Latin and case-sensitive: in an RTL
              field the characters would be reordered on screen and a hyphen
              would jump to the wrong end. autoCapitalize and autoCorrect are
              off for the same reason - a phone keyboard "helpfully" capitalising
              the first letter would invalidate a valid code. */}
          <input
            id="login-code"
            className="login__code"
            dir="ltr"
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="one-time-code"
            placeholder="کد ۳۲ حرفی را بچسبانید"
            value={code}
            maxLength={80}
            disabled={pending}
            onChange={(event) => {
              /* Strip whitespace only. Nothing else is normalised: the code is
                 case-sensitive and hyphens and underscores are part of its
                 alphabet. */
              setCode(event.target.value.replace(/\s+/g, ""))
              setError(null)
            }}
            aria-describedby="login-code-help"
            aria-invalid={trimmed.length > 0 && !valid}
          />

          <p className="login__help" id="login-code-help">
            {trimmed.length === 0
              ? "کد ۳۲ حرف است و حرف بزرگ و کوچک آن مهم است."
              : valid
                ? "کد کامل است."
                : remaining > 0
                  ? "‏" + remaining + " نویسه دیگر لازم است."
                  : "کد باید دقیقاً ۳۲ نویسه و فقط شامل حرف لاتین، عدد، خط تیره و زیرخط باشد."}
          </p>

          {expired && !error ? (
            <p className="login__error" role="status">
              نشست شما تمام شده بود و از حساب خارج شدید. برای ادامه دوباره وارد شوید.
            </p>
          ) : null}

          {error ? (
            <p className="login__error" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            className="login__submit"
            disabled={!valid || pending}
          >
            {pending ? "در حال بررسی کد..." : "ورود"}
          </button>
        </form>

        <p className="login__note">
          هر کد فقط یک بار و تا حدود پنج دقیقه کار می‌کند. اگر پیام خطا گرفتید،
          از ربات کد تازه بگیرید.
        </p>

        <Link className="login__skip" href="/discover">
          بدون ورود جستجو می‌کنم
        </Link>
      </div>
    </main>
  )
}

/* useSearchParams needs a Suspense boundary to keep this route prerenderable. */
export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login" />}>
      <LoginForm />
    </Suspense>
  )
}
