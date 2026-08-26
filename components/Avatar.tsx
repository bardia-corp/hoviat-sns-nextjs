import { displayName, type Profile } from "@/lib/people"

/**
 * A person's avatar.
 *
 * When there is no picture, the fallback is not a stock photo but the first
 * one or two letters of the nickname (falling back to the display name), so
 * the circle still says who it belongs to. The span is a flex box, which is
 * what keeps the letters centred both ways at any size.
 */
export default function Avatar({
  person,
  size,
}: {
  person: Profile
  size: number
}) {
  if (person.profile_url) {
    return <img src={person.profile_url} alt="" width={size} height={size} />
  }

  const source = person.nickname || displayName(person)
  const initials = Array.from(source.trim()).slice(0, 2).join("")

  return (
    <span
      className="avatar-initials"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
