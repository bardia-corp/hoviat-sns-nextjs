/**
 * Mock dataset plus the display helpers every profile view uses.
 *
 * The data here is now only a fallback: with SNS_USE_MOCK=1 it stands in for
 * the API so the design stays workable while staging is down, throttled, or
 * unreachable. It is generated in the exact shape the API returns, nulls
 * included, so nothing downstream can tell the difference.
 *
 * The display helpers are the important part of this file. Every field except
 * three can be null, and a null means "hidden or unset" with no way to
 * distinguish them, so each helper has to render absence deliberately.
 */

import { faDigits, jalaliMonthYear } from "./date"
import type { Profile, SocialLink } from "./api/types"
import { COUNTRIES, OCCUPATIONS } from "./vocab"
import { platformFor } from "./social"

/* Re-exported so the many components importing from "@/lib/people" keep
   working while the real types live with the API layer. */
export type { Profile, SocialLink }
export { COUNTRIES, OCCUPATIONS }
export {
  PLATFORMS,
  platformFor,
  socialLabel,
  socialUrl,
  socialHandle,
  type Platform,
} from "./social"

/* size defaults to 20 and caps at 100 server-side. 7 is a product choice well
   inside that ceiling. */
export const PAGE_SIZE = 7

export const AVATARS = ["/avatars/a1.jpg", "/avatars/a2.jpg", "/avatars/a3.jpg"]

/* Persian display names paired with a Latin slug for usernames and social
   handles: a handle on Telegram or LinkedIn is Latin anyway. */
const FIRST_NAMES: Array<[string, string]> = [
  ["\u0628\u0627\u0631\u062f\u06cc\u0627", "bardya"],
  ["\u0633\u0627\u0631\u0627", "sara"],
  ["\u0627\u0645\u06cc\u0631", "amir"],
  ["\u0646\u06cc\u06a9\u0627", "nika"],
  ["\u0631\u0636\u0627", "reza"],
  ["\u0644\u06cc\u0644\u0627", "leila"],
  ["\u06a9\u06cc\u0627\u0646", "kian"],
  ["\u0645\u06cc\u0646\u0627", "mina"],
  ["\u0622\u0631\u0634", "arash"],
  ["\u06cc\u0627\u0633\u0645\u06cc\u0646", "yasmin"],
  ["\u0627\u0645\u06cc\u062f", "omid"],
  ["\u0634\u06cc\u0631\u06cc\u0646", "shirin"],
  ["\u0641\u0631\u06cc\u062f", "farid"],
  ["\u0627\u0644\u0647\u0627\u0645", "elham"],
  ["\u0633\u06cc\u0646\u0627", "sina"],
  ["\u067e\u0631\u06cc\u0633\u0627", "parisa"],
  ["\u062d\u0633\u06cc\u0646", "hossein"],
  ["\u0645\u0631\u06cc\u0645", "maryam"],
  ["\u06a9\u0627\u0648\u0647", "kaveh"],
  ["\u0646\u0633\u0631\u06cc\u0646", "nasrin"],
  ["\u0645\u06cc\u0644\u0627\u062f", "milad"],
  ["\u0631\u0648\u06cc\u0627", "roya"],
  ["\u0646\u06af\u0627\u0631", "negar"],
  ["\u067e\u0648\u06cc\u0627", "pouya"],
  ["\u0645\u0647\u0633\u0627", "mahsa"],
  ["\u0628\u0627\u0628\u06a9", "babak"],
  ["\u0632\u0647\u0631\u0627", "zahra"],
  ["\u0639\u0644\u06cc", "ali"],
  ["\u0641\u0627\u0637\u0645\u0647", "fatemeh"],
  ["\u0645\u062d\u0645\u062f", "mohammad"],
]

const LAST_NAMES: Array<[string, string]> = [
  ["\u0631\u062d\u0645\u0627\u0646\u06cc", "rahmani"],
  ["\u06a9\u0631\u06cc\u0645\u06cc", "karimi"],
  ["\u0635\u0627\u062f\u0642\u06cc", "sadeghi"],
  ["\u062a\u0647\u0631\u0627\u0646\u06cc", "tehrani"],
  ["\u0645\u0648\u0633\u0648\u06cc", "mousavi"],
  ["\u0627\u062d\u0645\u062f\u06cc", "ahmadi"],
  ["\u0627\u0628\u0631\u0627\u0647\u06cc\u0645\u06cc", "ebrahimi"],
  ["\u062d\u0633\u06cc\u0646\u06cc", "hosseini"],
  ["\u062c\u0639\u0641\u0631\u06cc", "jafari"],
  ["\u06a9\u0645\u0627\u0644\u06cc", "kamali"],
  ["\u0646\u0627\u062f\u0631\u06cc", "naderi"],
  ["\u0632\u0646\u062f", "zand"],
  ["\u0634\u06cc\u0631\u0627\u0632\u06cc", "shirazi"],
  ["\u0628\u0647\u0631\u0627\u0645\u06cc", "bahrami"],
  ["\u0631\u0633\u062a\u0645\u06cc", "rostami"],
  ["\u06cc\u0632\u062f\u0627\u0646\u06cc", "yazdani"],
  ["\u0645\u0631\u0627\u062f\u06cc", "moradi"],
  ["\u0646\u0648\u0631\u06cc", "nouri"],
  ["\u0631\u0636\u0627\u06cc\u06cc", "rezaei"],
  ["\u0645\u062d\u0645\u062f\u06cc", "mohammadi"],
  ["\u0639\u0644\u0648\u06cc", "alavi"],
  ["\u0641\u0631\u0647\u0627\u062f\u06cc", "farhadi"],
  ["\u06a9\u0627\u0634\u0627\u0646\u06cc", "kashani"],
  ["\u0627\u0633\u0641\u0646\u062f\u06cc\u0627\u0631\u06cc", "esfandiari"],
  ["\u0642\u0627\u0633\u0645\u06cc", "ghasemi"],
  ["\u0633\u0644\u06cc\u0645\u06cc", "salimi"],
]

const BIO_TEMPLATES = [
  "{occupation} \u0633\u0627\u06a9\u0646 {country}. {years} \u0633\u0627\u0644 \u0633\u0627\u0628\u0642\u0647 \u06a9\u0627\u0631\u06cc \u0648 \u0622\u0645\u0627\u062f\u0647 \u067e\u0631\u0648\u0698\u0647\u200c\u0647\u0627\u06cc \u062a\u0627\u0632\u0647.",
  "{years} \u0633\u0627\u0644 \u0627\u0633\u062a \u06a9\u0647 \u0628\u0647\u200c\u0639\u0646\u0648\u0627\u0646 {occupation} \u062f\u0631 {country} \u06a9\u0627\u0631 \u0645\u06cc\u200c\u06a9\u0646\u0645. \u062e\u0648\u0634\u062d\u0627\u0644 \u0645\u06cc\u200c\u0634\u0648\u0645 \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u06af\u06cc\u0631\u06cc\u062f.",
  "{occupation} \u062f\u0631 {country}. \u062a\u0645\u0631\u06a9\u0632 \u0645\u0646 \u0628\u0631 \u0631\u0627\u0628\u0637\u0647 \u0628\u0644\u0646\u062f\u0645\u062f\u062a \u0648 \u06af\u0641\u062a\u06af\u0648\u06cc \u0634\u0641\u0627\u0641 \u0627\u0633\u062a.",
  "{years} \u0633\u0627\u0644 \u0628\u0647\u200c\u0639\u0646\u0648\u0627\u0646 {occupation} \u06a9\u0627\u0631 \u06a9\u0631\u062f\u0647\u200c\u0627\u0645 \u0648 \u0627\u06a9\u0646\u0648\u0646 \u062f\u0631 {country} \u0632\u0646\u062f\u06af\u06cc \u0645\u06cc\u200c\u06a9\u0646\u0645.",
  "{occupation} \u062f\u0631 {country}. \u0628\u0631\u0627\u06cc \u0647\u0645\u06a9\u0627\u0631\u06cc\u060c \u0645\u0634\u0627\u0648\u0631\u0647 \u0648 \u0645\u0639\u0631\u0641\u06cc \u062f\u0631 \u062f\u0633\u062a\u0631\u0633\u0645.",
  "{years} \u0633\u0627\u0644 \u062a\u062c\u0631\u0628\u0647 \u0628\u0647\u200c\u0639\u0646\u0648\u0627\u0646 {occupation}\u060c \u0627\u06a9\u0646\u0648\u0646 \u0645\u0642\u06cc\u0645 {country}.",
]

/* Deterministic PRNG: the same rows must render on the server and the client,
   or React reports a hydration mismatch. */
function mulberry32(seed: number) {
  let a = seed
  return function random() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function link(platform: string, handle: string): SocialLink {
  const spec = platformFor(platform)
  /* Stored as a URL, exactly as the API stores it. */
  return {
    platform,
    url: spec ? spec.toUrl(handle) : "https://" + handle,
    label: null,
  }
}

function buildPeople(): Profile[] {
  const random = mulberry32(20260824)
  const people: Profile[] = []

  for (let i = 0; i < 100; i += 1) {
    const [first, firstSlug] =
      FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)]
    const [last, lastSlug] =
      LAST_NAMES[Math.floor(random() * LAST_NAMES.length)]
    const occupation = OCCUPATIONS[Math.floor(random() * OCCUPATIONS.length)]
    /* Weighted to the first few entries, which is what the real distribution
       looks like: two countries hold most of the users. */
    const countryIndex = Math.floor(Math.pow(random(), 2.2) * COUNTRIES.length)
    const country = COUNTRIES[Math.min(countryIndex, COUNTRIES.length - 1)]
    const years = 3 + Math.floor(random() * 18)
    const template = BIO_TEMPLATES[Math.floor(random() * BIO_TEMPLATES.length)]

    const handle = firstSlug + (random() > 0.5 ? "" : ".") + lastSlug

    const bio = template
      .replace("{occupation}", occupation)
      .replace("{country}", country)
      .replace("{years}", faDigits(years))

    /* Privacy modelled as nulls, because that is all the API exposes. */
    const hideUsername = random() < 0.18
    const hideBio = random() < 0.14
    const hideOccupation = random() < 0.07
    const hideCountry = random() < 0.05
    const hidePhone = random() < 0.72
    const hideSocial = random() < 0.35

    const links: SocialLink[] = []
    if (!hideSocial) {
      links.push(link("telegram", handle))
      if (random() > 0.45) links.push(link("linkedin", handle))
      if (random() > 0.7) links.push(link("instagram", handle))
    }

    people.push({
      user_id: 8998800000 + i * 917,
      is_ban: false,
      is_registered: random() < 0.68,
      join_date: 1748000000 + Math.floor(random() * 38000000),
      username: hideUsername ? null : handle,
      nickname: first,
      first_name: first,
      last_name: last,
      bio: hideBio ? null : bio,
      occupation: hideOccupation ? null : occupation,
      social_links: links.length > 0 ? links : null,
      phone_number: hidePhone ? null : "+98912" + (1000000 + i * 811),
      whatsapp_number: hidePhone ? null : "+98912" + (1000000 + i * 811),
      country: hideCountry ? null : country,
      profile_url: AVATARS[i % AVATARS.length],
    })
  }

  return people
}

/* Ordered by user_id descending, matching the API's fixed sort. */
export const PEOPLE: Profile[] = buildPeople().sort(
  (a, b) => b.user_id - a.user_id,
)

export function getPerson(userId: number): Profile | undefined {
  return PEOPLE.find((person) => person.user_id === userId)
}

/* Display helpers. Each survives every optional field being null, which is
   exactly what a privacy-restricted profile looks like. */

export function displayName(person: Profile): string {
  const full = [person.first_name, person.last_name].filter(Boolean).join(" ")
  if (full) return full
  if (person.nickname) return person.nickname
  if (person.username) return "@" + person.username
  return "\u06a9\u0627\u0631\u0628\u0631 " + faDigits(person.user_id)
}

export function displayHandle(person: Profile): string {
  return person.username
    ? "@" + person.username
    : "\u0634\u0646\u0627\u0633\u0647 \u062e\u0635\u0648\u0635\u06cc \u0627\u0633\u062a"
}

export function displayRole(person: Profile): string {
  const parts = [person.occupation, person.country].filter(Boolean)
  return parts.length > 0
    ? parts.join(" \u00b7 ")
    : "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0639\u0645\u0648\u0645\u06cc \u0646\u062f\u0627\u0631\u062f"
}

export function joinedLabel(person: Profile): string {
  if (!person.join_date) return "\u0646\u0627\u0645\u0634\u062e\u0635"
  /* join_date is unix seconds. */
  return jalaliMonthYear(person.join_date)
}
