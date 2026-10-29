/**
 * How client components talk to our own routes - and how a dead session gets
 * noticed.
 *
 * The token is httpOnly, so nothing here can inspect it. What this can do is
 * believe the server. Every response from our own API routes carries a
 * signedIn field, and a 401 means the session is over. Either one fires a
 * single event, and AuthProvider listens for it and drops the whole app to a
 * signed-out state.
 *
 * That is the fix for the worst bug in the previous version: a "sign in first"
 * error that left the user apparently signed in, with no way out but clearing
 * cookies by hand. Now the error and the sign-out are the same event, and the
 * server has already deleted the cookie by the time this runs.
 *
 * An event rather than a shared React hook because these calls happen inside
 * effects, actions and providers that do not all sit under one another.
 */

export const SESSION_EXPIRED_EVENT = "hoviat:session-expired"

export type SessionExpiredDetail = {
  /** Where the user was, so they can be returned there after signing in. */
  next?: string
  /** True when it should send them straight to the login screen. */
  redirect?: boolean
}

export function notifySessionExpired(detail: SessionExpiredDetail = {}): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(
    new CustomEvent<SessionExpiredDetail>(SESSION_EXPIRED_EVENT, { detail }),
  )
}

export type ApiResult<T> = {
  ok: boolean
  status: number
  /** The server's verdict on the session, never the client's guess. */
  signedIn: boolean
  data?: T
  message?: string
}

/**
 * One fetch for every same-origin call, so no screen has to remember to check
 * for an expired session - it cannot forget, because this does it.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      /* Never reuse a session-dependent response from the browser cache. */
      cache: "no-store",
      headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    })
  } catch {
    return {
      ok: false,
      status: 0,
      /* A failed request says nothing about the session, so it must not be
         mistaken for a sign-out. */
      signedIn: true,
      message: "ارتباط با سرور برقرار نشد. اتصال خود را بررسی کنید.",
    }
  }

  let body: (Partial<ApiResult<T>> & { data?: T }) | null = null

  try {
    body = (await response.json()) as Partial<ApiResult<T>> & { data?: T }
  } catch {
    body = null
  }

  /* The server is authoritative twice over: an explicit signedIn: false, or a
     401 regardless of what the body says. Without either verdict, a permission
     error or an HTML error from the proxy says nothing about authentication. */
  const signedIn =
    response.status === 401 ? false : (body?.signedIn ?? true)

  if (!signedIn) {
    notifySessionExpired({
      next:
        typeof window === "undefined"
          ? undefined
          : window.location.pathname + window.location.search,
    })
  }

  return {
    ok: Boolean(response.ok && body?.ok !== false),
    status: response.status,
    signedIn,
    data: body?.data,
    message: body?.message,
  }
}
