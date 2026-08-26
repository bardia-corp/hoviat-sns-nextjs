/**
 * Renders a page of results, or an empty state.
 *
 * This is a server component: the cards arrive in the initial HTML, which is
 * the whole point of the discover page. Only the bookmark button inside each
 * card is client-side.
 */

import type { Profile } from "@/lib/people"
import ProfileCard from "./ProfileCard"

export default function ResultsList({
  people,
  emptyMessage = "هنوز کسی با این فیلترها پیدا نشد. یک فیلتر را بردارید یا جستجوی کلی‌تری انجام دهید.",
}: {
  people: Profile[]
  emptyMessage?: string
}) {
  return (
    <ul className="cards">
      {people.length === 0 ? (
        <li className="empty glass">{emptyMessage}</li>
      ) : (
        people.map((person) => (
          <ProfileCard key={person.user_id} person={person} />
        ))
      )}
    </ul>
  )
}
