/**
 * Suggested countries and occupations.
 *
 * These are suggestions, not a schema. The backend stores both fields as free
 * text with no validation, and country is matched with case-sensitive
 * equality, so what is stored is whatever people typed. The real distribution
 * proves it: آلمان, المان, Deutschland, Germany, Alman, germany, Germani and
 * Deutchland are all the same country, and Hamburg, برلین and تهران are cities
 * filed as countries.
 *
 * Consequences, deliberately accepted:
 *
 *   - The canonical Persian spelling is offered first, because it is also the
 *     most common stored value.
 *   - Filtering by آلمان will not return the people who typed Deutschland.
 *     One request cannot ask for several spellings, since parameters are
 *     AND-ed, so this cannot be papered over in the frontend. It is a
 *     backend normalisation job.
 *   - COUNTRY_HINTS lets the picker's search box find آلمان when someone types
 *     "germany" or "deutschland", so the suggestion list is reachable in any
 *     script. Only the canonical value is ever sent.
 *   - The picker also accepts free text, so a value outside this list is
 *     always searchable.
 *
 * When the backend ships the distinct-values endpoint, this file becomes the
 * fallback for when that call fails.
 */

export type CountrySuggestion = {
  /** The exact string sent to the API. */
  value: string
  /** Extra spellings that should match this entry while typing. */
  hints?: string[]
}

/* Ordered by how many people actually use them, then the well-known ones the
   current data does not cover yet. */
export const COUNTRY_SUGGESTIONS: CountrySuggestion[] = [
  { value: "آلمان", hints: ["المان", "germany", "deutschland", "alman", "جرمنی"] },
  { value: "ایران", hints: ["iran", "ايران", "persia"] },
  { value: "افغانستان", hints: ["afghanistan", "afganistan"] },
  { value: "ترکیه", hints: ["turkey", "turkiye", "türkiye"] },
  { value: "ایتالیا", hints: ["italy", "italia"] },
  { value: "هلند", hints: ["netherlands", "holland"] },
  { value: "فرانسه", hints: ["france"] },
  { value: "اتریش", hints: ["austria"] },
  { value: "بلژیک", hints: ["belgium"] },
  { value: "اسپانیا", hints: ["spain", "espana"] },
  { value: "سوئد", hints: ["sweden"] },
  { value: "لهستان", hints: ["poland"] },
  { value: "کانادا", hints: ["canada"] },
  { value: "انگلستان", hints: ["england", "uk", "united kingdom", "بریتانیا"] },
  { value: "آمریکا", hints: ["usa", "united states", "امریکا", "america"] },
  { value: "امارات متحده عربی", hints: ["uae", "dubai", "دبی", "امارات"] },
  { value: "ترکمنستان", hints: ["turkmenistan"] },
  { value: "عراق", hints: ["iraq"] },
  { value: "قطر", hints: ["qatar"] },
  { value: "عمان", hints: ["oman"] },
  { value: "سوئیس", hints: ["switzerland", "swiss"] },
  { value: "دانمارک", hints: ["denmark"] },
  { value: "نروژ", hints: ["norway"] },
  { value: "فنلاند", hints: ["finland"] },
  { value: "ایرلند", hints: ["ireland"] },
  { value: "پرتغال", hints: ["portugal"] },
  { value: "یونان", hints: ["greece"] },
  { value: "چک", hints: ["czechia", "czech republic", "جمهوری چک"] },
  { value: "اوکراین", hints: ["ukraine"] },
  { value: "روسیه", hints: ["russia"] },
  { value: "گرجستان", hints: ["georgia"] },
  { value: "ارمنستان", hints: ["armenia"] },
  { value: "استرالیا", hints: ["australia"] },
  { value: "نیوزیلند", hints: ["new zealand"] },
  { value: "ژاپن", hints: ["japan"] },
  { value: "کره جنوبی", hints: ["south korea", "korea"] },
  { value: "چین", hints: ["china"] },
  { value: "هند", hints: ["india"] },
  { value: "مالزی", hints: ["malaysia"] },
  { value: "برزیل", hints: ["brazil"] },
  { value: "مکزیک", hints: ["mexico"] },
  { value: "آفریقای جنوبی", hints: ["south africa"] },
]

export const COUNTRIES: string[] = COUNTRY_SUGGESTIONS.map((c) => c.value)

export const OCCUPATION_SUGGESTIONS: CountrySuggestion[] = [
  { value: "پزشک", hints: ["doctor", "دکتر"] },
  { value: "دندانپزشک", hints: ["dentist"] },
  { value: "مهندس نرم‌افزار", hints: ["software engineer", "developer", "برنامه‌نویس"] },
  { value: "مهندس عمران", hints: ["civil engineer"] },
  { value: "مهندس برق", hints: ["electrical engineer"] },
  { value: "وکیل", hints: ["lawyer", "attorney"] },
  { value: "معمار", hints: ["architect"] },
  { value: "معلم", hints: ["teacher"] },
  { value: "پرستار", hints: ["nurse"] },
  { value: "داروساز", hints: ["pharmacist", "داروخانه"] },
  { value: "حسابدار", hints: ["accountant"] },
  { value: "مترجم", hints: ["translator"] },
  { value: "عکاس", hints: ["photographer"] },
  { value: "طراح گرافیک", hints: ["graphic designer"] },
  { value: "مشاور مهاجرت", hints: ["immigration consultant"] },
  { value: "بازاریاب", hints: ["marketer", "marketing"] },
  { value: "آشپز", hints: ["chef", "cook"] },
  { value: "آرایشگر", hints: ["barber", "hairdresser"] },
  { value: "راننده", hints: ["driver"] },
  { value: "مکانیک", hints: ["mechanic"] },
  { value: "دانشجو", hints: ["student"] },
]

export const OCCUPATIONS: string[] = OCCUPATION_SUGGESTIONS.map((o) => o.value)

/* Matching for the picker's search box: the typed text is compared against the
   canonical value and every hint, so Latin and Persian both find the entry. */
export function suggestionMatches(
  item: CountrySuggestion,
  term: string,
): boolean {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  if (item.value.toLowerCase().includes(needle)) return true
  return (item.hints ?? []).some((hint) =>
    hint.toLowerCase().includes(needle),
  )
}

export function filterSuggestions(
  items: CountrySuggestion[],
  term: string,
): string[] {
  return items
    .filter((item) => suggestionMatches(item, term))
    .map((item) => item.value)
}
