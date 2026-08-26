import { NextResponse } from "next/server"
import { listBookmarks } from "@/lib/api/bookmarks"
import { ApiError } from "@/lib/api/types"
import { clearSession, getSessionToken } from "@/lib/session"

/**
 * The signed-in user's bookmarks, read through our own origin so the client
 * never needs the token.
 *
 * Two failures are carefully kept apart here, because conflating them is what
 * produced a 401 on every page load:
 *
 *   No cookie at all - an ordinary signed-out visitor, which is not an error.
 *   Answered 200 with signedIn: false and an empty list. Every page that
 *   renders cards hits this route, and a red line in the console on every one
 *   of them buries the failures that matter.
 *
 *   A cookie the API refuses - the session is over. Answered 401, and the
 *   cookie is destroyed on this very response, so the browser cannot keep
 *   presenting a credential that has already been rejected.
 */
export async function GET(request: Request) {
  const token = await getSessionToken()

  if (!token) {
    return NextResponse.json({
      ok: true,
      signedIn: false,
      data: [],
      total: 0,
    })
  }

  try {
    const { data, total } = await listBookmarks(token)

    return NextResponse.json({ ok: true, signedIn: true, data, total })
  } catch (error) {
    const api = error instanceof ApiError ? error : null

    if (api?.isAuth) {
      /* The token is dead. End the session here rather than reporting it and
         leaving the browser to carry on with a credential the API refuses. */
      await clearSession()

      return NextResponse.json(
        {
          ok: false,
          signedIn: false,
          data: [],
          message: "\u0646\u0634\u0633\u062a \u0634\u0645\u0627 \u062a\u0645\u0627\u0645 \u0634\u062f\u0647 \u0627\u0633\u062a. \u062f\u0648\u0628\u0627\u0631\u0647 \u0648\u0627\u0631\u062f \u0634\u0648\u06cc\u062f.",
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        /* Still signed in: this failed for some other reason, and treating it
           as a sign-out would throw the user out over a timeout. */
        signedIn: true,
        data: [],
        message: api?.userMessage ?? "\u0641\u0647\u0631\u0633\u062a \u0630\u062e\u06cc\u0631\u0647\u200c\u0647\u0627 \u062e\u0648\u0627\u0646\u062f\u0647 \u0646\u0634\u062f.",
      },
      { status: api?.status || 500 },
    )
  }
}
