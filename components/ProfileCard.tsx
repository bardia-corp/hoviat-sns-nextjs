"use client"

/**
 * A single search result.
 *
 * The bookmark control is an icon, not a label: a plus while the person is not
 * saved, and a filled bookmark on the dimensional blue orb once they are. The
 * fixed-size circle means the two states never reflow the card.
 *
 * The name/avatar area is a button that opens the quick-look modal, kept
 * separate from the bookmark control so saving never navigates by accident.
 *
 * Bookmarking needs a session, so when signed out the control routes to the
 * sign-in page instead of silently doing nothing.
 */

import { avatarFor, displayName, type Profile } from "@/lib/people"
import { BookmarkFilledIcon, PlusIcon, VerifiedIcon } from "./Icons"
import { useBookmarks } from "./BookmarksProvider"
import { usePersonModal } from "./PersonModalProvider"
import { useAuth } from "./AuthProvider"
import { useRouter } from "next/navigation"

export default function ProfileCard({ person }: { person: Profile }) {
  const bookmarks = useBookmarks()
  const { open } = usePersonModal()
  const { signedIn } = useAuth()
  const router = useRouter()
  const saved = bookmarks.has(person.user_id)
  const name = displayName(person)

  return (
    <li className="card glass">
      <button
        type="button"
        className="card__main"
        onClick={() => open(person)}
        aria-label={"دیدن " + name}
      >
        <span className="card__avatar">
          {/* Plain img: the avatars are already cropped to 256px and served
              from /public, so next/image would add machinery for no benefit. */}
          <img src={avatarFor(person)} alt="" width={52} height={52} />
        </span>

        <span className="card__body">
          <span className="card__name">
            <span className="card__name-text">{name}</span>
            {person.is_registered ? (
              <span className="card__badge" title="ثبت‌نام شده">
                <VerifiedIcon />
                <span className="sr-only">ثبت‌نام شده</span>
              </span>
            ) : null}
          </span>
          {/* Occupation and country each get their own line. The username is
              not shown: it is an identifier, not information, and it was
              crowding out the two fields people actually scan for. */}
          <span className="card__meta">
            {person.occupation ?? "شغل خصوصی است"}
          </span>
          <span className="card__meta card__meta--quiet">
            {person.country ?? "کشور خصوصی است"}
          </span>
        </span>
      </button>

      <button
        type="button"
        className={saved ? "icon-btn icon-btn--orb" : "icon-btn"}
        aria-pressed={saved}
        onClick={() =>
          signedIn ? bookmarks.toggle(person.user_id) : router.push("/login")
        }
        title={
          !signedIn
            ? "برای ذخیره وارد شوید"
            : saved
              ? "حذف از ذخیره‌ها"
              : "ذخیره"
        }
      >
        {saved ? <BookmarkFilledIcon size={19} /> : <PlusIcon size={20} />}
        <span className="sr-only">
          {(saved ? "حذف ذخیره‌ی " : "ذخیره‌ی ") + name}
        </span>
      </button>
    </li>
  )
}
