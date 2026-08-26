/**
 * Social links: platform plus identifier on this side, a URL on the API side.
 *
 * The API stores { platform, url, label }. People are never asked to paste a
 * URL - they choose a platform and type the identifier that platform actually
 * uses (a Telegram username, a WhatsApp number, a LinkedIn slug) - so this
 * file is the translation layer in both directions.
 *
 * parse is best-effort. A link created outside this app, or on a platform we
 * do not know, keeps its URL and is displayed as-is rather than mangled or
 * hidden.
 */

import type { SocialLink } from "./api/types"

export type { SocialLink }

export type Platform = {
  /** Lowercase identifier, matching the backend convention. */
  key: string
  label: string
  /** Shown before the input so it is obvious what is being typed. */
  prefix: string
  placeholder: string
  hint: string
  toUrl: (handle: string) => string
  /** Pulls the identifier back out of a stored URL. */
  fromUrl: (url: string) => string | null
}

function afterHost(url: string, hosts: string[]): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase()
    if (!hosts.includes(host)) return null
    const path = parsed.pathname.replace(/^\/+|\/+$/g, "")
    return path || null
  } catch {
    return null
  }
}

export const PLATFORMS: Platform[] = [
  {
    key: "telegram",
    label: "Telegram",
    prefix: "t.me/",
    placeholder: "username",
    hint: "\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u062a\u0644\u06af\u0631\u0627\u0645 \u0634\u0645\u0627\u060c \u0628\u062f\u0648\u0646 @",
    toUrl: (handle) => "https://t.me/" + handle.replace(/^@/, ""),
    fromUrl: (url) => afterHost(url, ["t.me", "telegram.me"]),
  },
  {
    key: "instagram",
    label: "Instagram",
    prefix: "instagram.com/",
    placeholder: "username",
    hint: "\u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u0627\u06cc\u0646\u0633\u062a\u0627\u06af\u0631\u0627\u0645 \u0634\u0645\u0627",
    toUrl: (handle) => "https://instagram.com/" + handle.replace(/^@/, ""),
    fromUrl: (url) => afterHost(url, ["instagram.com"]),
  },
  {
    key: "x",
    label: "X",
    prefix: "x.com/",
    placeholder: "username",
    hint: "\u0634\u0646\u0627\u0633\u0647 \u0627\u06a9\u0633 \u0634\u0645\u0627\u060c \u0628\u062f\u0648\u0646 @",
    toUrl: (handle) => "https://x.com/" + handle.replace(/^@/, ""),
    fromUrl: (url) => afterHost(url, ["x.com", "twitter.com"]),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    prefix: "linkedin.com/in/",
    placeholder: "profile-name",
    hint: "\u0628\u062e\u0634 \u067e\u0627\u06cc\u0627\u0646\u06cc \u0646\u0634\u0627\u0646\u06cc \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u0644\u06cc\u0646\u06a9\u062f\u06cc\u0646 \u0634\u0645\u0627",
    toUrl: (handle) =>
      "https://linkedin.com/in/" + handle.replace(/^\/?in\//, ""),
    fromUrl: (url) => {
      const path = afterHost(url, ["linkedin.com", "de.linkedin.com"])
      return path ? path.replace(/^in\//, "") : null
    },
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    prefix: "+",
    placeholder: "98 912 000 0000",
    hint: "\u0634\u0645\u0627\u0631\u0647 \u062a\u0644\u0641\u0646 \u0628\u0627 \u06a9\u062f \u06a9\u0634\u0648\u0631. \u0648\u0627\u062a\u0633\u200c\u0627\u067e \u0646\u0627\u0645 \u06a9\u0627\u0631\u0628\u0631\u06cc \u0646\u062f\u0627\u0631\u062f.",
    toUrl: (handle) => "https://wa.me/" + handle.replace(/[^0-9]/g, ""),
    fromUrl: (url) => afterHost(url, ["wa.me", "api.whatsapp.com"]),
  },
  {
    key: "website",
    label: "\u0648\u0628\u200c\u0633\u0627\u06cc\u062a",
    prefix: "https://",
    placeholder: "example.com",
    hint: "\u0646\u0634\u0627\u0646\u06cc \u0633\u0627\u06cc\u062a \u0634\u0645\u0627\u060c \u0628\u062f\u0648\u0646 //:https",
    toUrl: (handle) => "https://" + handle.replace(/^https?:\/\//, ""),
    fromUrl: (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
  },
]

export function platformFor(key: string): Platform | undefined {
  return PLATFORMS.find((platform) => platform.key === key.toLowerCase())
}

/** What to print on the chip. A custom label wins, then the platform name. */
export function socialLabel(link: SocialLink): string {
  if (link.label) return link.label
  return platformFor(link.platform)?.label ?? link.platform
}

/** The href. The API already stores a URL, so this is mostly a guard. */
export function socialUrl(link: SocialLink): string {
  const url = link.url ?? ""
  if (/^https?:\/\//i.test(url)) return url
  const platform = platformFor(link.platform)
  return platform ? platform.toUrl(url) : "https://" + url
}

/** The identifier, for editing. Falls back to the bare URL when unparseable. */
export function socialHandle(link: SocialLink): string {
  const platform = platformFor(link.platform)
  if (platform) {
    const parsed = platform.fromUrl(link.url ?? "")
    if (parsed) return parsed
  }
  return (link.url ?? "").replace(/^https?:\/\//, "")
}

/** Editor row -> the shape PUT /account/social-links expects. */
export function toApiLink(input: {
  platform: string
  handle: string
  label?: string | null
}): SocialLink {
  const platform = platformFor(input.platform)
  const handle = input.handle.trim()
  return {
    platform: input.platform,
    url: platform ? platform.toUrl(handle) : handle,
    label: input.label?.trim() ? input.label.trim() : null,
  }
}
