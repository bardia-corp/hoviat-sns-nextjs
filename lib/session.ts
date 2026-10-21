import "server-only"
import { Buffer } from "node:buffer"
import { cookies } from "next/headers"

/**
 * Where the session lives, and the only thing that knows whether there is one.
 *
 * One cookie, httpOnly, holding the JWT. Nothing readable by script, and no
 * companion "you are signed in" hint - that hint was a mistake. It could drift
 * out of step with the token it described, and when it did, the interface went
 * on insisting the user was signed in while every request came back 401. The
 * browser must not hold an opinion about the session that the server can
 * contradict.
 *
 * So the rule now: this cookie's presence *is* the session, the server is the
 * only thing that reads or writes it, and the moment the API rejects the token
 * the cookie is destroyed. See clearSession.
 *
 * Secure is conditional because a Secure cookie is dropped on http://localhost
 * by some browsers, which would make login appear to succeed and then do
 * nothing in development.
 *
 * Cookie expiry follows the issued token, including older short-lived tokens.
 * There is no refresh endpoint; an expired token requires another login.
 */

export const SESSION_COOKIE = "hoviat_token"

/**
 * The old readable flag. Kept only so that clearSession can delete it: a
 * browser that used an earlier build still carries one, and left alone it
 * would go on lying about the session forever. Nothing writes it any more.
 */
const LEGACY_FLAG_COOKIE = "hoviat_session"

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  }
}

/** Expiry is read only to limit local session/cookie lifetime, never to grant
 * authorization. The API still verifies the JWT signature and claims. */
function tokenExpiry(token: string): Date | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) return null
    const payload: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"))
    if (!payload || typeof payload !== "object" || !("exp" in payload)) return null
    const exp = payload.exp
    if (typeof exp !== "number" || !Number.isFinite(exp)) return null
    const expires = new Date(exp * 1000)
    return Number.isFinite(expires.getTime()) ? expires : null
  } catch { return null }
}

export function sessionCookieOptions(token: string) {
  const expires = tokenExpiry(token)
  const maxAge = expires ? Math.floor((expires.getTime() - Date.now()) / 1000) : 0
  if (maxAge <= 0 || !expires) throw new Error("EXPIRED_OR_INVALID_SESSION")
  return { ...cookieOptions(), maxAge, expires }
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  /* Older cookies may outlive their JWT. Ignore them even in a server render,
     where cookie mutation is unavailable; signed API requests remain guarded. */
  if (!value) return null
  const expires = tokenExpiry(value)
  return expires && expires.getTime() > Date.now() ? value : null
}

export async function isSignedIn(): Promise<boolean> {
  return (await getSessionToken()) !== null
}

/** For code paths that cannot proceed without a token. */
export async function requireSessionToken(): Promise<string> {
  const token = await getSessionToken()
  if (!token) throw new Error("NO_SESSION")
  return token
}

export async function setSessionToken(token: string): Promise<void> {
  let options: ReturnType<typeof sessionCookieOptions>
  try { options = sessionCookieOptions(token) }
  catch (error) { await clearSession(); throw error }
  const store = await cookies()
  store.set(SESSION_COOKIE, token, options)
  /* Anyone arriving from an older build sheds the stale flag on login. */
  store.delete(LEGACY_FLAG_COOKIE)
}

/**
 * Ends the session, locally and immediately.
 *
 * Called on sign-out, and - more importantly - by every route and action that
 * gets a 401 from the API. The backend is stateless, so there is nothing to
 * revoke upstream; what matters is that the browser stops carrying a token the
 * API has already refused, because that is what produced an interface stuck
 * asking for a sign-in it believed it already had.
 *
 * Both delete and an expired overwrite are issued. delete alone can miss when
 * a cookie was originally written with different attributes, and a session
 * that fails to end is not a failure worth being subtle about.
 */
export async function clearSession(): Promise<void> {
  const store = await cookies()

  for (const name of [SESSION_COOKIE, LEGACY_FLAG_COOKIE]) {
    store.delete(name)
    store.set(name, "", { ...cookieOptions(), httpOnly: false, maxAge: 0 })
  }
}
