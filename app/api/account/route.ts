import { NextResponse } from "next/server"
import { getAccount } from "@/lib/api/account"
import { ApiError } from "@/lib/api/types"
import { clearSession, getSessionToken } from "@/lib/session"

/**
 * GET /account/me, proxied.
 *
 * The profile editor holds draft state across several fields, so it is a client
 * component and needs its own read - without ever seeing the token. Writes go
 * through server actions; this is read-only.
 *
 * As everywhere else: a refused token ends the session on this response rather
 * than being reported as a page that failed to load. The profile screen then
 * shows the sign-in invitation, which is the truth, instead of an error box
 * offering a retry that could never succeed.
 */
export async function GET() {
  const token = await getSessionToken()

  if (!token) {
    return NextResponse.json({ ok: false, signedIn: false }, { status: 401 })
  }

  try {
    const account = await getAccount(token)
    return NextResponse.json({ ok: true, signedIn: true, data: account })
  } catch (error) {
    const api = error instanceof ApiError ? error : null

    if (api?.isAuth) {
      await clearSession()
      return NextResponse.json(
        {
          ok: false,
          signedIn: false,
          message: "\u0646\u0634\u0633\u062a \u0634\u0645\u0627 \u062a\u0645\u0627\u0645 \u0634\u062f\u0647 \u0627\u0633\u062a. \u062f\u0648\u0628\u0627\u0631\u0647 \u0648\u0627\u0631\u062f \u0634\u0648\u06cc\u062f.",
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        signedIn: true,
        message: api?.userMessage ?? "\u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u062e\u0648\u0627\u0646\u062f\u0647 \u0646\u0634\u062f.",
      },
      { status: api?.status || 500 },
    )
  }
}
