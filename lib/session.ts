import "server-only"
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
 * Seven days matches the token's own lifetime. There is no refresh endpoint, so
 * when it expires the only path is logging in again; the cookie dying at the
 * same moment keeps the UI honest about that.
 */

export const SESSION_COOKIE = "hoviat_token"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

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

export function sessionCookieOptions() {
  return { ...cookieOptions(), maxAge: SESSION_MAX_AGE }
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE)?.value
  /* An empty string is not a token. A cleared cookie can arrive as one. */
  return value ? value : null
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
  const store = await cookies()
  store.set(SESSION_COOKIE, token, sessionCookieOptions())
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
