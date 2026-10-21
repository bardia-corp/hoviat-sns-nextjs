import type { SocialLink } from "./api/types"
import type { BusinessContactInput } from "./api/owned-business-types"

export type ContactKind = "telegram" | "whatsapp" | "phone" | "linkedin" | "instagram" | "twitter" | "bluesky" | "discord" | "email" | "website"
export type ContactValues = Record<ContactKind, string>
export const EMPTY_CONTACTS: ContactValues = { telegram: "", whatsapp: "", phone: "", linkedin: "", instagram: "", twitter: "", bluesky: "", discord: "", email: "", website: "" }
export const CONTACT_TEMPLATES = [
  { key: "telegram", label: "تلگرام", prefix: "t.me/", placeholder: "username", hint: "نام کاربری، بدون @", inputMode: "text" },
  { key: "whatsapp", label: "واتس‌اپ", prefix: "+", placeholder: "49 151 23456789", hint: "شماره همراه با کد کشور", inputMode: "tel" },
  { key: "phone", label: "شماره تماس", prefix: "+", placeholder: "49 30 123456", hint: "شماره همراه با کد کشور", inputMode: "tel" },
  { key: "linkedin", label: "لینکدین", prefix: "linkedin.com/in/", placeholder: "profile-name", hint: "شناسهٔ پروفایل لینکدین", inputMode: "text" },
  { key: "instagram", label: "اینستاگرام", prefix: "instagram.com/", placeholder: "username", hint: "نام کاربری یا پیوند پروفایل", inputMode: "text" },
  { key: "twitter", label: "ایکس / توییتر", prefix: "x.com/", placeholder: "username", hint: "نام کاربری یا پیوند پروفایل", inputMode: "text" },
  { key: "bluesky", label: "بلواسکای", prefix: "bsky.app/profile/", placeholder: "name.bsky.social", hint: "شناسه یا پیوند پروفایل بلواسکای", inputMode: "text" },
  { key: "discord", label: "دیسکورد", prefix: "", placeholder: "https://discord.gg/invite", hint: "پیوند دعوت یا پروفایل دیسکورد", inputMode: "url" },
] as const
export const BUSINESS_CONTACT_TEMPLATES = [...CONTACT_TEMPLATES.map((template) => template.key === "linkedin" ? {
  ...template, prefix: "linkedin.com/", placeholder: "company/business-name", hint: "پیوند لینکدین شخص یا شرکت؛ مثلاً company/business-name یا in/profile-name",
} : template),
  { key: "website", label: "وب‌سایت", prefix: "", placeholder: "https://example.de", hint: "نشانی وب‌سایت کسب‌وکار", inputMode: "url" },
  { key: "email", label: "ایمیل", prefix: "", placeholder: "hello@example.de", hint: "نشانی ایمیل کسب‌وکار", inputMode: "email" },
] as const

function digits(value: string) {
  return value.replace(/[۰-۹]/g, (character) => String(character.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, (character) => String(character.charCodeAt(0) - 1632))
}

function pathOn(value: string, hosts: string[]): string | null {
  try {
    const url = new URL(value)
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.search || url.hash) return null
    return hosts.includes(url.hostname.toLowerCase().replace(/^www\./, "")) ? decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, "") : null
  } catch { return null }
}

export function normalizeContact(kind: ContactKind, raw: string, business = false): string | null {
  let value = digits(raw.trim())
  if (!value) return ""
  if (kind === "email") {
    value = value.replace(/^mailto:/i, "")
    return /^[^\s@<>:?#]+@[^\s@<>:?#]+\.[^\s@<>:?#]+$/.test(value) ? value : null
  }
  if (kind === "website") {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : "https://" + value)
      return ["https:", "http:"].includes(url.protocol) && url.hostname.includes(".") && !url.username && !url.password ? url.href : null
    } catch { return null }
  }
  if (kind === "phone" || kind === "whatsapp") {
    if (kind === "whatsapp" && /^https?:/i.test(value)) value = pathOn(value, ["wa.me"]) ?? "!"
    value = value.replace(/^tel:/i, "")
    if (!/^\+?[\d\s().-]+$/.test(value)) return null
    value = value.replace(/[^\d]/g, "").replace(/^00/, "")
    return /^[1-9]\d{6,14}$/.test(value) ? value : null
  }
  if (kind === "telegram") {
    if (/^https?:/i.test(value)) value = pathOn(value, ["t.me", "telegram.me"]) ?? "!"
    value = value.replace(/^@/, "")
    return /^[A-Za-z][A-Za-z0-9_]{3,31}$/.test(value) ? value : null
  }
  if (kind === "discord") {
    try {
      const url = new URL(value)
      const host = url.hostname.toLowerCase()
      return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash &&
        ((host === "discord.gg" && /^\/[A-Za-z0-9-]+\/?$/.test(url.pathname)) ||
        (["discord.com", "www.discord.com"].includes(host) && /^\/(invite\/[A-Za-z0-9-]+|users\/\d+)\/?$/.test(url.pathname))) ? url.href : null
    } catch { return null }
  }
  if (kind === "instagram" || kind === "twitter" || kind === "bluesky") {
    if (/^https?:/i.test(value)) {
      const hosts = kind === "instagram" ? ["instagram.com"] : kind === "twitter" ? ["x.com", "twitter.com"] : ["bsky.app"]
      const path = pathOn(value, hosts)
      value = kind === "bluesky" ? (path?.startsWith("profile/") ? path.slice(8) : "!") : path ?? "!"
    }
    value = value.replace(/^@/, "")
    if (kind === "instagram") return /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/.test(value) ? value : null
    if (kind === "twitter") return /^[A-Za-z0-9_]{1,15}$/.test(value) ? value : null
    return /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/.test(value) || /^did:plc:[a-z2-7]{24}$/.test(value) ? value : null
  }
  if (kind === "linkedin" && business) {
    // A business may link either its company page or a practitioner's profile.
    // Retain the path type so company links never become /in/company/... links.
    if (/^https?:/i.test(value)) value = pathOn(value, ["linkedin.com", "de.linkedin.com"]) ?? "!"
    value = value.replace(/^\/+|\/+$/g, "")
    if (!/^(in|company)\//.test(value)) value = "in/" + value
    return /^(in|company)\/[A-Za-z0-9][A-Za-z0-9_-]{1,99}$/.test(value) ? value : null
  }
  if (/^https?:/i.test(value)) {
    const path = pathOn(value, ["linkedin.com", "de.linkedin.com"])
    value = path?.startsWith("in/") ? path.slice(3) : "!"
  }
  value = value.replace(/^\/?in\//, "")
  return /^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$/.test(value) ? value : null
}

export function contactUrl(kind: ContactKind, value: string): string {
  if (kind === "website") return value
  if (kind === "email") return "mailto:" + value
  if (kind === "phone") return "tel:+" + value
  if (kind === "whatsapp") return "https://wa.me/" + value
  if (kind === "telegram") return "https://t.me/" + value
  if (kind === "instagram") return "https://www.instagram.com/" + value
  if (kind === "twitter") return "https://x.com/" + value
  if (kind === "bluesky") return "https://bsky.app/profile/" + value
  if (kind === "discord") return value
  return "https://www.linkedin.com/" + (/^(in|company)\//.test(value) ? value : "in/" + value)
}

function socialValue(link: SocialLink): { kind: ContactKind; value: string } | null {
  const platform = link.platform.toLowerCase()
  const kind = (platform === "x" ? "twitter" : platform) as ContactKind
  if (!CONTACT_TEMPLATES.some((template) => template.key === kind)) return null
  const value = normalizeContact(kind, link.url)
  return value ? { kind, value } : null
}

export function readSocialContacts(links: SocialLink[]) {
  const values = { ...EMPTY_CONTACTS }
  const indices: Partial<Record<ContactKind, number>> = {}
  links.forEach((link, index) => {
    const parsed = socialValue(link)
    if (parsed && indices[parsed.kind] === undefined) { values[parsed.kind] = parsed.value; indices[parsed.kind] = index }
  })
  return { values, indices, preservedCount: links.length - Object.keys(indices).length }
}

export function validateContacts(values: ContactValues, business = false): { values: ContactValues; error: string | null } {
  const normalized = { ...EMPTY_CONTACTS }
  for (const template of business ? BUSINESS_CONTACT_TEMPLATES : CONTACT_TEMPLATES) {
    const value = normalizeContact(template.key, values[template.key], business)
    if (value === null) return { values: normalized, error: `${template.label}: ${template.hint} را به‌صورت معتبر وارد کنید.` }
    normalized[template.key] = value
  }
  return { values: normalized, error: null }
}

export function writeSocialContacts(original: SocialLink[], values: ContactValues): SocialLink[] {
  const { indices } = readSocialContacts(original)
  const result: SocialLink[] = []
  original.forEach((link, index) => {
    const kind = CONTACT_TEMPLATES.find((template) => indices[template.key] === index)?.key
    if (!kind) { result.push(link); return }
    if (values[kind]) result.push({ ...link, url: contactUrl(kind, values[kind]) })
  })
  CONTACT_TEMPLATES.forEach(({ key, label }) => {
    if (values[key] && indices[key] === undefined) result.push({ platform: key, url: contactUrl(key, values[key]), label })
  })
  return result
}

export function readBusinessContacts(contacts: BusinessContactInput[]) {
  const values = { ...EMPTY_CONTACTS }
  const visible = Object.fromEntries(Object.keys(EMPTY_CONTACTS).map((key) => [key, false])) as Record<ContactKind, boolean>
  const indices: Partial<Record<ContactKind, number>> = {}
  contacts.forEach((contact, index) => {
    const platform = contact.platform?.toLowerCase()
    const kind = contact.type === "email" ? "email" : contact.type === "phone" && !platform ? "phone" : contact.type === "url" && !platform ? "website" : (platform === "x" ? "twitter" : platform) as ContactKind | undefined
    if (!kind || !BUSINESS_CONTACT_TEMPLATES.some((template) => template.key === kind) || indices[kind] !== undefined) return
    const value = normalizeContact(kind, contact.value, true)
    if (value) { values[kind] = value; visible[kind] = contact.is_visible; indices[kind] = index }
  })
  return { values, visible, indices, preservedCount: contacts.length - Object.keys(indices).length }
}

export function writeBusinessContacts(original: BusinessContactInput[], values: ContactValues, visible: Record<ContactKind, boolean>): BusinessContactInput[] {
  const { indices } = readBusinessContacts(original)
  const make = (kind: ContactKind, displayOrder: number, previous?: BusinessContactInput): BusinessContactInput => ({
    title: previous?.title ?? BUSINESS_CONTACT_TEMPLATES.find((template) => template.key === kind)!.label,
    type: kind === "phone" ? "phone" : kind === "email" ? "email" : "url", value: kind === "phone" ? "+" + values[kind] : kind === "email" ? values[kind] : contactUrl(kind, values[kind]),
    platform: kind === "phone" || kind === "email" ? null : kind, display_order: displayOrder, is_visible: visible[kind],
  })
  const result: BusinessContactInput[] = []
  original.forEach((contact, index) => {
    const kind = BUSINESS_CONTACT_TEMPLATES.find((template) => indices[template.key] === index)?.key
    const { title, type, value, platform, display_order, is_visible } = contact
    if (!kind) result.push({ title, type, value, platform, display_order, is_visible })
    else if (values[kind]) result.push(make(kind, display_order, contact))
  })
  let order = Math.max(-1, ...original.map((contact) => contact.display_order)) + 1
  BUSINESS_CONTACT_TEMPLATES.forEach(({ key }) => { if (values[key] && indices[key] === undefined) result.push(make(key, order++)) })
  return result
}
