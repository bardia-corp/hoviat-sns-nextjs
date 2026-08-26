import "server-only"
import { apiRequest } from "./http"
import type {
  Account,
  PrivacyPatch,
  ProfilePatch,
  Session,
  SocialLink,
} from "./types"

/**
 * Login and the authenticated account endpoints.
 *
 * Nothing here is ever cached: it is all per-user, and three of the five are
 * mutations.
 */

/**
 * POST /auth/exchange-token
 *
 * The only way in. The user gets a 32-character single-use code from
 * @hoviatloginbot and types or pastes it here. Codes are case-sensitive and
 * expire in about five minutes, so the failure message has to explain all
 * three ways it can go wrong rather than just saying "invalid".
 */
/* Shorter than the default: someone standing at a login form with a code
   that expires in five minutes needs to be told quickly that the server is
   unreachable, not made to wait out a ten-second timeout. */
const AUTH_TIMEOUT_MS = Number(process.env.SNS_AUTH_TIMEOUT_MS ?? 6000)

export async function exchangeToken(code: string): Promise<Session> {
  const { data } = await apiRequest<Session>("/auth/exchange-token", {
    method: "POST",
    body: { token: code },
    timeoutMs: AUTH_TIMEOUT_MS,
  })
  return data
}

/** GET /account/me - the unfiltered profile plus every privacy toggle. */
export async function getAccount(token: string): Promise<Account> {
  const { data } = await apiRequest<Account>("/account/me", { token })
  return data
}

/**
 * PATCH /account/profile
 *
 * Partial: omitted fields stay, explicit null clears. Unknown fields are a
 * 400, so callers must pass a ProfilePatch and nothing wider - note that
 * username is absent because it comes from Telegram and cannot be changed.
 */
export async function updateProfile(
  token: string,
  patch: ProfilePatch,
): Promise<Account> {
  const { data } = await apiRequest<Account>("/account/profile", {
    method: "PATCH",
    token,
    body: patch,
  })
  return data
}

/** PATCH /account/privacy - same partial rules, values are public/private. */
export async function updatePrivacy(
  token: string,
  patch: PrivacyPatch,
): Promise<Account> {
  const { data } = await apiRequest<Account>("/account/privacy", {
    method: "PATCH",
    token,
    body: patch,
  })
  return data
}

/**
 * PUT /account/social-links - replace-all.
 *
 * The submitted array becomes the entire list, so the editor always sends
 * every row it holds, and an empty array is the delete-all. A partial send
 * here would silently destroy the links it left out.
 */
export async function replaceSocialLinks(
  token: string,
  links: SocialLink[],
): Promise<Account> {
  const { data } = await apiRequest<Account>("/account/social-links", {
    method: "PUT",
    token,
    body: {
      links: links.map((link) => ({
        platform: link.platform,
        url: link.url,
        label: link.label ?? null,
      })),
    },
  })
  return data
}

/** POST /account/me/profile-picture - multipart, field name "file". */
export async function uploadAvatar(
  token: string,
  file: File,
): Promise<{ profile_url: string | null }> {
  const form = new FormData()
  form.append("file", file)

  const { data } = await apiRequest<{ profile_url: string | null }>(
    "/account/me/profile-picture",
    { method: "POST", token, form },
  )
  return data
}

export async function deleteAvatar(
  token: string,
): Promise<{ profile_url: string | null }> {
  const { data } = await apiRequest<{ profile_url: string | null }>(
    "/account/me/profile-picture",
    { method: "DELETE", token },
  )
  return data
}
