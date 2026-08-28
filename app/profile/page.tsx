"use client"

/**
 * Profile: your information, your links, your privacy.
 *
 * Reads GET /account/me through our own origin - so the token stays in the
 * httpOnly cookie - and writes through server actions, one per endpoint:
 *
 *   PATCH /account/profile        the six editable fields
 *   PUT   /account/social-links   replace-all
 *   PATCH /account/privacy        one toggle at a time
 *   POST  /account/me/profile-picture
 *
 * Three things about this screen follow from the API rather than from taste.
 *
 * The two editors are independent, each with its own button and draft, because
 * they are separate endpoints - fixing a typo in one link should not put your
 * whole profile into an edit state.
 *
 * Social links are replace-all: the editor always submits every row it holds,
 * since sending a subset would silently delete the rest.
 *
 * Privacy toggles save immediately and optimistically. They are single
 * booleans with an obvious effect, and making someone press Save after
 * flipping a switch invites leaving a profile public by accident.
 *
 * username is displayed but never editable: it comes from Telegram.
 */

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import type { Account, Privacy, SocialLink } from "@/lib/api/types"
import { PRIVACY_FIELDS, formatJoinDate } from "@/lib/account"
import {
  COUNTRIES,
  COUNTRY_SUGGESTIONS,
  OCCUPATIONS,
  suggestionMatches,
} from "@/lib/vocab"
import {
  PLATFORMS,
  platformFor,
  socialHandle,
  socialLabel,
  socialUrl,
} from "@/lib/social"
import {
  removeAvatar,
  saveAvatar,
  savePrivacy,
  saveProfile,
  saveSocialLinks,
  signOutAction,
} from "@/app/actions/account"
import { Picker } from "@/components/Picker"
import Avatar from "@/components/Avatar"
import RequireAuth from "@/components/RequireAuth"
import { apiFetch } from "@/lib/client-session"
import { useAuth } from "@/components/AuthProvider"
import { ExternalIcon, TrashIcon, VerifiedIcon } from "@/components/Icons"
import { ProfileSkeleton } from "@/components/Skeleton"

/* Editor rows hold platform + identifier. The URL the API stores is built on
   submit, because nobody should be asked to type one. */
type LinkRow = { platform: string; handle: string; label?: string | null }

export default function ProfilePage() {
  return (
    <main className="screen">
      <header className="hero">
        <h1 className="hero__title hero__title--sm">پروفایل من</h1>
        <p className="hero__sub">
          اطلاعات و شبکه‌های اجتماعی خود را کامل کنید و تصمیم بگیرید دیگران چه
          چیزی از شما ببینند.
        </p>
      </header>

      <RequireAuth
        title="وارد حساب کاربری شوید"
        text="برای دسترسی به داشبورد، پروفایل و ذخیره‌های خود وارد حساب کاربری شوید. البته می‌توانید بدون ورود هم جست‌وجوی کاربران را ادامه دهید."
      >
        <ProfileBody />
      </RequireAuth>
    </main>
  )
}

function ProfileBody() {
  const { signOut } = useAuth()

  const [account, setAccount] = useState<Account | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiFetch<Account>("/api/account")

      /* The session is gone. apiFetch has already announced it, so RequireAuth
         is about to show the sign-in invitation - which is the truth. An error
         box here would offer a retry that could never succeed. */
      if (!result.signedIn) return

      if (!result.ok || !result.data) {
        setLoadError(result.message ?? "پروفایل خوانده نشد.")
        return
      }

      setAccount(result.data)
      setLoadError(null)
    } catch {
      setLoadError("ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loadError) {
    return (
      <div className="empty glass">
        <p>{loadError}</p>
        <button
          type="button"
          className="btn-add"
          style={{ marginTop: 12 }}
          onClick={() => {
            setLoadError(null)
            load()
          }}
        >
          تلاش دوباره
        </button>
      </div>
    )
  }

  if (!account) return <ProfileSkeleton />

  return (
    <>
      <ProfileHeader
        account={account}
        onChanged={load}
        setNotice={setNotice}
      />

      {notice ? (
        <p className="panel__hint" role="status" style={{ marginTop: 10 }}>
          {notice}
        </p>
      ) : null}

      <InfoSection account={account} onSaved={load} setNotice={setNotice} />

      <LinksSection account={account} onSaved={load} setNotice={setNotice} />

      <PrivacySection
        account={account}
        setAccount={setAccount}
        saving={saving}
        setSaving={setSaving}
        setNotice={setNotice}
      />

      <button
        type="button"
        className="btn-add"
        style={{ marginTop: 18 }}
        onClick={async () => {
          await signOutAction()
          await signOut()
        }}
      >
        خروج از حساب
      </button>
    </>
  )
}

/* ---------------------------------------------------------------- header */

function ProfileHeader({
  account,
  onChanged,
  setNotice,
}: {
  account: Account
  onChanged: () => Promise<void>
  setNotice: (value: string | null) => void
}) {
  const [busy, setBusy] = useState(false)

  const name =
    [account.first_name, account.last_name].filter(Boolean).join(" ") ||
    account.nickname ||
    "بدون نام"

  async function upload(file: File) {
    setBusy(true)
    setNotice(null)

    const form = new FormData()
    form.append("file", file)
    const result = await saveAvatar(form)

    setBusy(false)
    setNotice(result.ok ? "عکس پروفایل به‌روز شد." : (result.message ?? null))
    if (result.ok) await onChanged()
  }

  return (
    <div className="profile-head glass">
      <div className="profile-head__main">
        <div className="profile-head__avatar">
          <Avatar person={account} size={72} />
        </div>

        <div className="profile-head__info">
          <h2 className="profile-head__name">
            {name}
            {account.is_registered ? (
              <span className="card__badge" title="ثبت‌نام شده">
                <VerifiedIcon size={15} />
                <span className="sr-only">ثبت‌نام شده</span>
              </span>
            ) : null}
          </h2>

          {/* Occupation and country share one quiet line; the join date gets a
              pill so the panel reads as summary, not as a form. */}
          <p className="profile-head__meta">
            {[account.occupation, account.country]
              .filter(Boolean)
              .join(" \u00b7 ") || "شغل و کشور ثبت نشده‌اند"}
          </p>
          <p className="tag">{"عضو از " + formatJoinDate(account.join_date)}</p>
        </div>
      </div>

      <div className="avatar-actions">
        {/* A label wrapping a hidden input: file inputs cannot be styled, and
            the accept list mirrors what the API accepts, so an unsupported
            file is refused before a slow upload ends in a rejection. */}
        <label className="btn-edit">
          {busy ? "در حال ارسال..." : "تغییر عکس"}
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              /* Reset, so choosing the same file twice fires again. */
              event.target.value = ""
              if (file) upload(file)
            }}
          />
        </label>

        {account.profile_url ? (
          <button
            type="button"
            className="btn-edit"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              const result = await removeAvatar()
              setBusy(false)
              setNotice(result.ok ? "عکس پروفایل حذف شد." : (result.message ?? null))
              if (result.ok) await onChanged()
            }}
          >
            حذف عکس
          </button>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ info */

function InfoSection({
  account,
  onSaved,
  setNotice,
}: {
  account: Account
  onSaved: () => Promise<void>
  setNotice: (value: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* Nulls become empty strings for the inputs, and empty strings become nulls
     again on submit - which is how a field gets cleared. */
  const [draft, setDraft] = useState({
    first_name: account.first_name ?? "",
    last_name: account.last_name ?? "",
    bio: account.bio ?? "",
    occupation: account.occupation ?? "",
    country: account.country ?? "",
    whatsapp_number: account.whatsapp_number ?? "",
  })

  function start() {
    setDraft({
      first_name: account.first_name ?? "",
      last_name: account.last_name ?? "",
      bio: account.bio ?? "",
      occupation: account.occupation ?? "",
      country: account.country ?? "",
      whatsapp_number: account.whatsapp_number ?? "",
    })
    setError(null)
    setEditing(true)
  }

  async function submit() {
    setBusy(true)
    setError(null)

    const result = await saveProfile(draft)

    setBusy(false)

    if (!result.ok) {
      setError(result.message ?? "ذخیره نشد.")
      return
    }

    setEditing(false)
    setNotice("اطلاعات ذخیره شد.")
    await onSaved()
  }

  const rows: Array<{ label: string; value: string | null; ltr?: boolean }> = [
    { label: "نام", value: account.first_name },
    { label: "نام خانوادگی", value: account.last_name },
    { label: "نام نمایشی", value: account.nickname },
    { label: "شغل", value: account.occupation },
    { label: "کشور", value: account.country },
    { label: "واتس‌اپ", value: account.whatsapp_number, ltr: true },
    { label: "معرفی", value: account.bio },
  ]

  return (
    <div className="panel glass" style={{ marginTop: 14 }}>
      <div className="panel__head">
        <h2 className="panel__title">اطلاعات من</h2>
        {!editing ? (
          <button type="button" className="btn-edit" onClick={start}>
            ویرایش
          </button>
        ) : null}
      </div>

      {editing ? (
        <>
          <div className="field">
            <label className="field__label" htmlFor="first-name">
              نام
            </label>
            <input
              id="first-name"
              className="field__input"
              value={draft.first_name}
              onChange={(event) =>
                setDraft({ ...draft, first_name: event.target.value })
              }
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="last-name">
              نام خانوادگی
            </label>
            <input
              id="last-name"
              className="field__input"
              value={draft.last_name}
              onChange={(event) =>
                setDraft({ ...draft, last_name: event.target.value })
              }
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="bio">
              معرفی
            </label>
            <textarea
              id="bio"
              className="field__textarea"
              rows={4}
              value={draft.bio}
              onChange={(event) =>
                setDraft({ ...draft, bio: event.target.value })
              }
            />
            <p className="field__hint">
              این متن در جستجوی سراسری هم دیده می‌شود.
            </p>
          </div>

          <div className="field">
            <p className="field__label">شغل</p>
            {/* Free text: the list only suggests, the backend stores whatever
                is typed. */}
            <input
              className="field__input"
              type="text"
              list="profile-occupation-options"
              placeholder="مثلاً پزشک"
              value={draft.occupation}
              onChange={(event) =>
                setDraft({ ...draft, occupation: event.target.value })
              }
            />
            <datalist id="profile-occupation-options">
              {OCCUPATIONS.map((occupation) => (
                <option key={occupation} value={occupation} />
              ))}
            </datalist>
            <p className="field__hint">
              دیگران با جستجوی همین شغل، شما را پیدا می‌کنند.
            </p>
          </div>

          <div className="field">
            <p className="field__label">کشور</p>
            <Picker
              label="کشور"
              placeholder="انتخاب کشور"
              options={COUNTRIES}
              searchable
              allowCustom
              matchOption={(option, needle) => {
                const suggestion = COUNTRY_SUGGESTIONS.find(
                  (item) => item.value === option,
                )
                return suggestion
                  ? suggestionMatches(suggestion, needle)
                  : option.includes(needle)
              }}
              value={draft.country}
              onChange={(next) => setDraft({ ...draft, country: next })}
            />
            {/* Country is matched byte for byte, so choosing from the list is
                what makes you findable. Two spellings of one country are two
                different countries as far as search is concerned. */}
            <p className="field__hint">
              کشور را از فهرست انتخاب کنید؛ املای متفاوت باعث می‌شود در جستجوی
              کشور پیدا نشوید.
            </p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="whatsapp">
              شماره واتس‌اپ
            </label>
            <input
              id="whatsapp"
              className="field__input"
              dir="ltr"
              inputMode="tel"
              value={draft.whatsapp_number}
              onChange={(event) =>
                setDraft({ ...draft, whatsapp_number: event.target.value })
              }
            />
          </div>

          {/* Not editable: the phone number and username come from Telegram,
              and PATCH /account/profile rejects unknown fields outright. */}
          <p className="field__hint">
            نام کاربری و شماره تلفن از تلگرام گرفته می‌شود و از اینجا قابل تغییر
            نیست.
          </p>

          {error ? (
            <p className="login__error" role="alert" style={{ marginTop: 12 }}>
              {error}
            </p>
          ) : null}

          <div className="panel__actions">
            <button
              type="button"
              className="modal__btn modal__btn--ghost"
              style={{ flex: 1 }}
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              لغو
            </button>
            <button
              type="button"
              className="modal__btn modal__btn--primary"
              style={{ flex: 1 }}
              disabled={busy}
              onClick={submit}
            >
              {busy ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </>
      ) : (
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
                {row.value ?? "ثبت نشده"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- links */

function LinksSection({
  account,
  onSaved,
  setNotice,
}: {
  account: Account
  onSaved: () => Promise<void>
  setNotice: (value: string | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<LinkRow[]>([])

  const links: SocialLink[] = account.social_links ?? []

  function start() {
    /* Stored URLs are turned back into platform + identifier for editing. */
    setRows(
      links.map((link) => ({
        platform: link.platform,
        handle: socialHandle(link),
        label: link.label ?? null,
      })),
    )
    setError(null)
    setEditing(true)
  }

  function update(index: number, patch: Partial<LinkRow>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  async function submit() {
    setBusy(true)
    setError(null)

    /* Replace-all: every row is sent, empty ones dropped. An empty array is a
       valid request and deletes all links. */
    const result = await saveSocialLinks(rows)

    setBusy(false)

    if (!result.ok) {
      setError(result.message ?? "ذخیره نشد.")
      return
    }

    setEditing(false)
    setNotice("پیوندها ذخیره شد.")
    await onSaved()
  }

  return (
    <div className="panel glass" style={{ marginTop: 14 }}>
      <div className="panel__head">
        <h2 className="panel__title">شبکه‌های اجتماعی</h2>
        {!editing ? (
          <button type="button" className="btn-edit" onClick={start}>
            ویرایش
          </button>
        ) : null}
      </div>

      <p className="panel__hint">
        پلتفرم را انتخاب کنید و آیدی خودتان را وارد کنید؛ لینک کامل خودش ساخته
        می‌شود.
      </p>

      {editing ? (
        <>
          {rows.map((row, index) => {
            const platform = platformFor(row.platform) ?? PLATFORMS[0]
            return (
              <div className="field" key={index}>
                {/* LTR row: platform names and identifiers are Latin. The
                    Persian hint below the row stays RTL. */}
                <div className="social-editor__row" dir="ltr">
                  <div className="social-editor__platform">
                    <Picker
                      label="پلتفرم"
                      placeholder="انتخاب پلتفرم"
                      options={PLATFORMS.map((item) => item.label)}
                      value={platform.label}
                      onChange={(nextLabel) => {
                        const next = PLATFORMS.find(
                          (item) => item.label === nextLabel,
                        )
                        /* Changing platform clears the identifier: a Telegram
                           username is not a phone number. */
                        if (next) {
                          update(index, { platform: next.key, handle: "" })
                        }
                      }}
                    />
                  </div>

                  {/* The prefix is shown, not typed, so what belongs in the
                      box is unambiguous. */}
                  <div className="prefixed social-editor__url">
                    <span className="prefixed__label" dir="ltr">
                      {platform.prefix}
                    </span>
                    <input
                      className="prefixed__input"
                      dir="ltr"
                      value={row.handle}
                      placeholder={platform.placeholder}
                      inputMode={platform.key === "whatsapp" ? "tel" : "text"}
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      onChange={(event) =>
                        update(index, { handle: event.target.value })
                      }
                      aria-label={platform.label}
                    />
                  </div>

                  <button
                    type="button"
                    className="social-editor__remove"
                    aria-label={"حذف " + platform.label}
                    onClick={() =>
                      setRows(rows.filter((_, i) => i !== index))
                    }
                  >
                    <TrashIcon />
                  </button>
                </div>
                <p className="field__hint">{platform.hint}</p>
              </div>
            )
          })}

          <button
            type="button"
            className="btn-add"
            onClick={() =>
              setRows([...rows, { platform: PLATFORMS[0].key, handle: "" }])
            }
          >
            + افزودن پلتفرم
          </button>

          {error ? (
            <p className="login__error" role="alert" style={{ marginTop: 12 }}>
              {error}
            </p>
          ) : null}

          <div className="panel__actions">
            <button
              type="button"
              className="modal__btn modal__btn--ghost"
              style={{ flex: 1 }}
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              لغو
            </button>
            <button
              type="button"
              className="modal__btn modal__btn--primary"
              style={{ flex: 1 }}
              disabled={busy}
              onClick={submit}
            >
              {busy ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        </>
      ) : links.length > 0 ? (
        /* dir="ltr" on the list only: the handles and platform names are
           Latin, while the Persian heading and hints above stay RTL. */
        <ul className="social" dir="ltr">
          {links.map((link) => (
            <li key={link.id ?? link.platform + link.url}>
              <a
                className="social__link"
                href={socialUrl(link)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{socialLabel(link)}</span>
                {/* The identifier is what the user picked, so it is shown,
                    not just the network name. */}
                <span className="social__handle">{socialHandle(link)}</span>
                <ExternalIcon />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="panel__hint">هنوز شبکه اجتماعی اضافه نکرده‌اید.</p>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- privacy */

function PrivacySection({
  account,
  setAccount,
  saving,
  setSaving,
  setNotice,
}: {
  account: Account
  setAccount: (next: Account) => void
  saving: boolean
  setSaving: (next: boolean) => void
  setNotice: (value: string | null) => void
}) {
  /* Optimistic, and rolled back on failure. A switch that waits for a round
     trip before moving feels broken; a switch that lies about the state of a
     privacy setting is worse, hence the rollback. */
  async function commit(patch: Partial<Privacy>, previous: Account) {
    setSaving(true)
    setNotice(null)

    const result = await savePrivacy(patch)

    setSaving(false)

    if (!result.ok) {
      setAccount(previous)
      setNotice(result.message ?? "تنظیم ذخیره نشد.")
    }
  }

  function toggleDiscoverable() {
    const next = !account.privacy.is_profile_discoverable
    const previous = account
    setAccount({
      ...account,
      privacy: { ...account.privacy, is_profile_discoverable: next },
    })
    commit({ is_profile_discoverable: next }, previous)
  }

  return (
    <>
      <div className="panel glass" style={{ marginTop: 14 }}>
        <h2 className="panel__title">دیده شدن در جستجو</h2>

        <div className="switch-row">
          <div className="switch-row__text">
            <p>نمایش در جستجو</p>
            <p className="switch-row__hint">
              اگر خاموش باشد، هیچ‌کس پروفایل شما را نمی‌بیند و در جستجو هم پیدا
              نمی‌شوید.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={account.privacy.is_profile_discoverable}
            aria-label="نمایش در جستجو"
            className="switch"
            disabled={saving}
            onClick={toggleDiscoverable}
          >
            <span className="switch__knob" />
          </button>
        </div>
      </div>

      <div className="panel glass" style={{ marginTop: 14 }}>
        <h2 className="panel__title">دیگران چه می‌بینند</h2>
        <p className="panel__hint">
          هر چیزی که خصوصی کنید، در پروفایل شما دیده نمی‌شود و با آن هم پیدا
          نمی‌شوید.
        </p>

        {PRIVACY_FIELDS.map((field) => {
          const isPublic = account.privacy[field.key] === "public"
          return (
            <div className="switch-row" key={field.key}>
              <div className="switch-row__text">
                <p>{field.label}</p>
                {field.hint ? (
                  <p className="switch-row__hint">{field.hint}</p>
                ) : null}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                aria-label={field.label}
                className="switch"
                disabled={saving}
                onClick={() => {
                  const previous = account
                  const next = isPublic ? "private" : "public"
                  setAccount({
                    ...account,
                    privacy: { ...account.privacy, [field.key]: next },
                  })
                  commit({ [field.key]: next } as Partial<Privacy>, previous)
                }}
              >
                <span className="switch__knob" />
              </button>
            </div>
          )
        })}
      </div>

      <p className="panel__hint" style={{ marginTop: 12 }}>
        می‌خواهید ببینید دیگران پروفایل شما را چگونه می‌بینند؟{" "}
        <Link href={"/profiles/" + account.user_id} style={{ fontWeight: 700 }}>
          نمای عمومی پروفایل
        </Link>
      </p>
    </>
  )
}
