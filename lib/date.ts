/**
 * Persian dates and digits.
 *
 * Why not Intl.DateTimeFormat("fa-IR")? Because it would produce this string
 * twice, once in Node and once in the browser, from two different ICU builds.
 * Any difference in digit shaping or separators between those builds is a
 * hydration mismatch on a server-rendered page. The conversion below is
 * arithmetic, so it is identical everywhere.
 *
 * Everything reads UTC parts for the same reason: getMonth() would return a
 * different month for a late-night timestamp depending on the machine's
 * timezone, and the server's timezone is not the visitor's.
 */

const PERSIAN_DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

const JALALI_MONTHS = [
  "\u0641\u0631\u0648\u0631\u062f\u06cc\u0646",
  "\u0627\u0631\u062f\u06cc\u0628\u0647\u0634\u062a",
  "\u062e\u0631\u062f\u0627\u062f",
  "\u062a\u06cc\u0631",
  "\u0645\u0631\u062f\u0627\u062f",
  "\u0634\u0647\u0631\u06cc\u0648\u0631",
  "\u0645\u0647\u0631",
  "\u0622\u0628\u0627\u0646",
  "\u0622\u0630\u0631",
  "\u062f\u06cc",
  "\u0628\u0647\u0645\u0646",
  "\u0627\u0633\u0641\u0646\u062f",
]

/** Latin digits to Persian, leaving everything else untouched. */
export function faDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[+digit])
}

const GREGORIAN_MONTH_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

/** Gregorian to Jalali. Returns [year, month 1-12, day]. */
function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  let jy = gy <= 1600 ? 0 : 979
  let year = gy - (gy <= 1600 ? 621 : 1600)
  const leapBase = gm > 2 ? year + 1 : year

  let days =
    365 * year +
    Math.floor((leapBase + 3) / 4) -
    Math.floor((leapBase + 99) / 100) +
    Math.floor((leapBase + 399) / 400) -
    80 +
    gd +
    GREGORIAN_MONTH_DAYS[gm - 1]

  jy += 33 * Math.floor(days / 12053)
  days %= 12053

  jy += 4 * Math.floor(days / 1461)
  days %= 1461

  if (days > 365) {
    jy += Math.floor((days - 1) / 365)
    days = (days - 1) % 365
  }

  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30)
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30)

  return [jy, jm, jd]
}

/** "\u0645\u0631\u062f\u0627\u062f \u06f1\u06f4\u06f0\u06f4" - month and year, for compact rows. */
export function jalaliMonthYear(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000)
  const [jy, jm] = toJalali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )
  return JALALI_MONTHS[jm - 1] + " " + faDigits(jy)
}

/** "\u06f1\u06f2 \u0645\u0631\u062f\u0627\u062f \u06f1\u06f4\u06f0\u06f4" - full date. */
export function jalaliFull(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000)
  const [jy, jm, jd] = toJalali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )
  return faDigits(jd) + " " + JALALI_MONTHS[jm - 1] + " " + faDigits(jy)
}
