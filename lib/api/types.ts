/**
 * The SNS API, as types.
 *
 * These mirror the guide exactly, including the parts that are inconvenient:
 * almost every field is nullable, and a null means "hidden or unset" with no
 * way to tell the two apart. The UI therefore treats absence as a first-class
 * state everywhere rather than as an error.
 */

export type Visibility = "public" | "private"

/* The API stores a social link as a URL. Users never paste one: they pick a
   platform and type the identifier that platform uses, and lib/social.ts
   converts between the two. platform has no server-side enum, so unknown
   values coming back from the API are rendered, not dropped. */
export type SocialLink = {
  id?: number
  platform: string
  url: string
  label?: string | null
}

export type Profile = {
  user_id: number
  is_ban: boolean
  is_registered: boolean
  join_date: number | null
  username: string | null
  nickname: string | null
  first_name: string | null
  last_name: string | null
  bio: string | null
  occupation: string | null
  social_links: SocialLink[] | null
  phone_number: string | null
  whatsapp_number: string | null
  country: string | null
  profile_url: string | null
}

/* Every toggle the API documents under /account/me. profile_picture and
   social_links are included here and were missing from the earlier mock. */
export type Privacy = {
  is_profile_discoverable: boolean
  profile_picture_visibility: Visibility
  username_visibility: Visibility
  first_name_visibility: Visibility
  last_name_visibility: Visibility
  nickname_visibility: Visibility
  country_visibility: Visibility
  phone_number_visibility: Visibility
  whatsapp_number_visibility: Visibility
  bio_visibility: Visibility
  occupation_visibility: Visibility
  social_links_visibility: Visibility
}

/** GET /account/me: the unfiltered own profile plus privacy settings. */
export type Account = Profile & { privacy: Privacy }

export type Meta = {
  total: number
  page: number
  size: number
  pages: number
}

export type SearchResult = {
  data: Profile[]
  meta: Meta
}

/** What POST /auth/exchange-token returns. */
export type Session = {
  access_token: string
  token_type: string
  user_id: number
  first_name: string | null
  username: string | null
}

/* Only the fields PATCH /account/profile accepts. Sending anything else is a
   400, so the type is the guard. null clears a field; undefined omits it. */
export type ProfilePatch = {
  first_name?: string | null
  last_name?: string | null
  bio?: string | null
  occupation?: string | null
  country?: string | null
  whatsapp_number?: string | null
}

export type PrivacyPatch = Partial<Privacy>

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHORIZED"
  | "INVALID_LOGIN_TOKEN"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "USER_NOT_FOUND"
  | "CONFLICT_OCCURRED"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR"
  | "NETWORK_ERROR"
  | "BAD_RESPONSE"
  | (string & {})

/**
 * One error type for the whole app.
 *
 * The API answers 200 with an error envelope in some cases and a real status
 * code in others, so the client normalises both into this. Screens branch on
 * code, never on the message text, and every message here is already in
 * Persian because it can end up in front of a user.
 */
export class ApiError extends Error {
  code: ApiErrorCode
  status: number

  constructor(code: ApiErrorCode, message: string, status = 0) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
  }

  get isAuth(): boolean {
    return (
      this.status === 401 ||
      this.code === "UNAUTHORIZED" ||
      this.code === "INVALID_LOGIN_TOKEN"
    )
  }

  get isNotFound(): boolean {
    return (
      this.status === 404 ||
      this.code === "NOT_FOUND" ||
      this.code === "USER_NOT_FOUND"
    )
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.code === "RATE_LIMITED"
  }

  /** A sentence safe to render, whatever the backend actually said. */
  get userMessage(): string {
    if (this.isRateLimited) {
      return "درخواست‌ها زیاد شد. چند لحظه صبر کنید و دوباره تلاش کنید."
    }
    if (this.isAuth) return "نشست شما منقضی شده است. دوباره وارد شوید."
    if (this.isNotFound) return "چیزی پیدا نشد."
    if (this.code === "NETWORK_ERROR") {
      return "ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید."
    }
    return "مشکلی پیش آمد. کمی بعد دوباره تلاش کنید."
  }
}
