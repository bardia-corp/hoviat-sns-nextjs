import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  avatarFor,
  displayName,
  joinedLabel,
  socialLabel,
  socialUrl,
} from "@/lib/people"
import { getProfile } from "@/lib/api/profiles"
import { faDigits } from "@/lib/date"
import { ExternalIcon, VerifiedIcon } from "@/components/Icons"
import BookmarkButton from "@/components/BookmarkButton"

/**
 * The dedicated profile page: GET /api/sns/profiles/{user_id}.
 *
 * A server component, and the canonical destination for a person. The modal is
 * the quick look; this is the URL that gets shared, linked and indexed, so it
 * carries the full field set and its own title and description.
 *
 * The contract returns 404 both when a user does not exist and when they set
 * is_profile_discoverable = false, so both collapse into notFound() here.
 *
 * In Next 15 params is a promise, hence the await.
 */

type PageProps = { params: Promise<{ id: string }> }

// A privacy change must apply to the next public page request.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const person = await getProfile(Number((await params).id))
  if (!person) return { title: "پروفایل پیدا نشد | هویت", robots: { index: false } }

  const name = displayName(person)
  const role = [person.occupation, person.country]
    .filter(Boolean)
    .join(" در ")

  return {
    title: role
      ? name + " – " + role + " | هویت"
      : name + " | هویت",
    description:
      person.bio ??
      (role
        ? name + " در هویت به‌عنوان " + role + " معرفی شده است."
        : name + " در هویت معرفی شده است."),
    alternates: { canonical: "/profiles/" + person.user_id },
  }
}

export default async function ProfilePage({ params }: PageProps) {
  /* A 404 here means either "no such user" or "this user turned discovery
     off". The API cannot distinguish them and neither should we: telling the
     difference would leak the existence of someone who chose to be hidden. */
  const person = await getProfile(Number((await params).id))
  if (!person) notFound()

  const name = displayName(person)

  /* ltr marks values the bidi algorithm must not reorder: a leading plus on a
     phone number would otherwise jump to the other end. */
  const rows: Array<{ label: string; value: string | null; ltr?: boolean }> = [
    { label: "شغل", value: person.occupation },
    { label: "کشور", value: person.country },
    { label: "عضویت از", value: joinedLabel(person) },
    { label: "شناسه کاربری", value: faDigits(person.user_id) },
    {
      label: "وضعیت",
      value: person.is_registered ? "ثبت‌نام شده" : "ثبت‌نام نشده",
    },
    { label: "تلفن", value: person.phone_number, ltr: true },
    { label: "واتس‌اپ", value: person.whatsapp_number, ltr: true },
  ]

  return (
    <main className="screen">
      <header className="hero">
        <p className="hero__eyebrow">
          <Link href="/discover" style={{ color: "inherit" }}>
            بازگشت به جستجو
          </Link>
        </p>
      </header>

      <div className="profile-head">
        <div className="person__avatar">
          <img src={avatarFor(person)} alt="" width={96} height={96} />
        </div>
        <h1 className="person__name">
          <span>{name}</span>
          {person.is_registered ? (
            <span className="card__badge" title="ثبت‌نام شده">
              <VerifiedIcon size={16} />
              <span className="sr-only">ثبت‌نام شده</span>
            </span>
          ) : null}
        </h1>
        {/* One line each, never joined with a separator. */}
        <p className="person__role">
          {person.occupation ?? "شغل خصوصی است"}
        </p>
        <p className="person__role">
          {person.country ?? "کشور خصوصی است"}
        </p>
      </div>

      <p className="person__bio">
        {person.bio ?? "این کاربر معرفی عمومی ثبت نکرده است."}
      </p>

      <div className="person__actions">
        <BookmarkButton userId={person.user_id} name={name} />
      </div>

      <div className="panel glass" style={{ marginTop: 20 }}>
        <h2 className="panel__title">راه‌های ارتباط</h2>
        {person.social_links && person.social_links.length > 0 ? (
          <ul className="social">
            {person.social_links.map((link) => (
              <li key={link.id ?? link.platform + link.url}>
                <a
                  className="social__link"
                  href={socialUrl(link)}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                >
                  {socialLabel(link)}
                  <ExternalIcon />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="panel__hint">
            این کاربر هنوز شبکه اجتماعی اضافه نکرده است.
          </p>
        )}
      </div>

      <div className="panel glass" style={{ marginTop: 14 }}>
        <h2 className="panel__title">جزئیات</h2>
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
        <p className="panel__hint" style={{ marginTop: 12 }}>
          فیلدهایی که خصوصی هستند توسط خود کاربر پنهان شده‌اند؛ این باعث
          می‌شود از جستجو بر اساس همان فیلد هم حذف شوند.
        </p>
      </div>
    </main>
  )
}
