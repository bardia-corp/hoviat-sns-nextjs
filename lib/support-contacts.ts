/**
 * SUPPORT CONTACT SETTINGS — shared by the homepage and My Businesses modal.
 * TODO: Set the real public contacts in .env.local using the two variables below.
 * Restart Next after editing them; production requires a rebuild because these
 * NEXT_PUBLIC values are included in the browser bundle. Never put secrets here.
 * Until configured, show clearly marked, non-clickable examples so visitors
 * cannot accidentally message an unrelated Telegram account or call a fake number.
 */
const telegram = (process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL || "").trim()
const phone = (process.env.NEXT_PUBLIC_SUPPORT_PHONE || "").trim()

function telegramHref(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "t.me" && !url.username && !url.password && /^\/[a-zA-Z0-9_]{5,32}\/?$/.test(url.pathname) ? url.href : null
  } catch { return null }
}

const telegramLink = telegramHref(telegram)
const phoneNumber = phone.replace(/[\s().-]/g, "")
const phoneLink = /^\+\d{7,15}$/.test(phoneNumber) ? `tel:${phoneNumber}` : null

export const supportContacts = [
  { id: "telegram", title: "تلگرام پشتیبانی", icon: "external" as const, value: telegramLink || "https://t.me/your_support_username", href: telegramLink },
  { id: "phone", title: "تلفن پشتیبانی", icon: "phone" as const, value: phoneLink ? phone : "+49 XXX XXXXXXX", href: phoneLink },
]
