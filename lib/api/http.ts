import "server-only"
import { ApiError } from "./types"

/**
 * The single place this app talks to the SNS API.
 *
 * Server-only by design. Every call is proxied through Next rather than made
 * from the browser, which buys three things:
 *
 *   - The JWT never reaches JavaScript. It lives in an httpOnly cookie and is
 *     attached here, server-side.
 *   - CORS and the staging TLS certificate stop mattering, since the browser
 *     only ever talks to our own origin.
 *   - Search responses can be cached by Next, which is the only real defence
 *     against the shared-IP rate limit: with SSR every visitor arrives at the
 *     API from one address, so 60 requests a minute is the budget for the
 *     entire site until the bypass key is in place.
 *
 * The import above is a compile-time fence: if any client component ever
 * imports this file, the build fails instead of shipping the token to the
 * browser.
 */

const DEFAULT_BASE = "https://staging.185.202.113.95.nip.io/api/sns"

export const API_BASE = (process.env.SNS_API_BASE ?? DEFAULT_BASE).replace(
  /\/+$/,
  "",
)

/* Set once the backend adds the limiter bypass. Absent, nothing breaks: the
   header is simply not sent and we stay inside the public limit. */
const INTERNAL_KEY = process.env.SNS_INTERNAL_KEY

/* Long enough for a slow staging box, short enough that a hung upstream does
   not hold a page render open until the platform kills it. */
const TIMEOUT_MS = Number(process.env.SNS_TIMEOUT_MS ?? 10000)

/** How long search results may be reused. Also the rate-limit shield. */
export const SEARCH_REVALIDATE = Number(process.env.SNS_SEARCH_TTL ?? 60)

type Envelope<T> = {
  data: T | null
  meta?: Record<string, unknown>
  error?: { code?: string; message?: string } | Record<string, never>
}

export type RequestOptions = {
  /** Separate public directory API, with the same response envelope. */
  baseUrl?: string
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  /** Query parameters. Undefined and empty values are dropped. */
  query?: Record<string, string | number | boolean | number[] | undefined>
  /** JSON body. Explicit nulls are preserved: the API uses null to clear. */
  body?: unknown
  /** Multipart body, for the avatar upload. Content-Type is left to fetch. */
  form?: FormData
  /** Bearer token. Omit for public endpoints. */
  token?: string | null
  /** Seconds to cache. Omit for anything authenticated or mutating. */
  revalidate?: number
  /** Cache tag, so a mutation can invalidate exactly what it changed. */
  tags?: string[]
  /** Overrides the default timeout. Login uses a shorter one: nobody should
      watch a spinner for ten seconds to be told the server is unreachable. */
  timeoutMs?: number
}

function buildUrl(path: string, query?: RequestOptions["query"], baseUrl = API_BASE): string {
  const url = new URL(
    baseUrl.replace(/\/+$/, "") + (path.startsWith("/") ? path : "/" + path),
  )

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === "") continue
      if (Array.isArray(value)) {
        value.forEach((entry) => url.searchParams.append(key, String(entry)))
        continue
      }
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

/**
 * Performs one request and returns the envelope's data.
 *
 * The API reports failure two different ways - a real status code, or 200 with
 * a populated error object - so both are normalised into ApiError here. Every
 * caller upstream can then branch on error.code alone.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const {
    method = "GET",
    query,
    body,
    form,
    token,
    revalidate,
    tags,
    timeoutMs,
  } = options

  const headers: Record<string, string> = { Accept: "application/json" }
  if (token) headers.Authorization = "Bearer " + token
  if (INTERNAL_KEY) headers["X-Internal-Key"] = INTERNAL_KEY
  /* Do NOT set Content-Type for FormData: fetch has to add the multipart
     boundary itself, and overriding it makes the upload unparseable. */
  if (body !== undefined) headers["Content-Type"] = "application/json"

  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } =
    {
      method,
      headers,
      signal: AbortSignal.timeout(timeoutMs ?? TIMEOUT_MS),
    }

  if (body !== undefined) init.body = JSON.stringify(body)
  if (form) init.body = form

  /* Anything carrying a token is per-user and must never land in a shared
     cache, however tempting the latency saving is. */
  if (token || method !== "GET" || revalidate === undefined) {
    init.cache = "no-store"
  } else {
    init.next = { revalidate, ...(tags ? { tags } : {}) }
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query, options.baseUrl), init)
  } catch (cause) {
    /* DNS failure, refused connection, a rejected TLS certificate, or the
       timeout above. All of them look the same to a user. */
    const reason = cause instanceof Error ? cause.message : String(cause)
    throw new ApiError("NETWORK_ERROR", reason, 0)
  }

  const text = await response.text()
  let envelope: Envelope<T> | null = null

  if (text) {
    try {
      envelope = JSON.parse(text) as Envelope<T>
    } catch {
      /* An HTML error page from a proxy, typically. */
      throw new ApiError(
        "BAD_RESPONSE",
        "Response was not JSON: " + text.slice(0, 120),
        response.status,
      )
    }
  }

  const error = envelope?.error
  const hasError =
    error && typeof error === "object" && "code" in error && error.code

  if (!response.ok || hasError) {
    const code =
      (hasError ? (error as { code?: string }).code : undefined) ??
      statusToCode(response.status)
    const message =
      (hasError ? (error as { message?: string }).message : undefined) ??
      "HTTP " + response.status
    throw new ApiError(code, message, response.status)
  }

  /* 204-style success: DELETE endpoints answer with a body, but be tolerant. */
  return {
    data: (envelope?.data ?? null) as T,
    meta: (envelope?.meta ?? {}) as Record<string, unknown>,
  }
}

function statusToCode(status: number): string {
  if (status === 400) return "INVALID_INPUT"
  if (status === 401) return "UNAUTHORIZED"
  if (status === 403) return "FORBIDDEN"
  if (status === 404) return "NOT_FOUND"
  if (status === 409) return "CONFLICT_OCCURRED"
  if (status === 413) return "INVALID_INPUT"
  if (status === 422) return "INVALID_INPUT"
  if (status === 429) return "RATE_LIMITED"
  return "INTERNAL_SERVER_ERROR"
}

/** True when the mock dataset should be used instead of the network. */
export const USE_MOCK = process.env.SNS_USE_MOCK === "1"
