import { NextResponse } from "next/server"
import { exchangeToken } from "@/lib/api/account"
import { ApiError } from "@/lib/api/types"
import { clearSession, isSignedIn, setSessionToken } from "@/lib/session"

/**
 * The session: the one place it is created, read, and destroyed.
 *
 *   GET     does a session exist?
 *   POST    exchange a bot code for one
 *   DELETE  end it
 *
 * GET exists so the browser never has to hold its own opinion about being
 * signed in. It reads the httpOnly cookie the client cannot see and answers
 * with a boolean - no upstream call, so it costs nothing and cannot be rate
 * limited. Combined with the rule that any 401 anywhere destroys the cookie,
 * that answer is trustworthy: a token the API has refused is already gone by
 * the time the next GET runs.
 *
 * The alternative - a readable "signed in" cookie - is what the previous
 * version did, and it could contradict the token it described. That is exactly
 * how someone ends up being told to sign in while the app insists they already
 * are.
 */

const CODE_LENGTH = 32
/* secrets.token_urlsafe(24) on the backend: exactly 32 chars from this set. */
const CODE_PATTERN = /^[A-Za-z0-9_-]{32}$/

export async function GET() {
  return NextResponse.json(
    { ok: true, signedIn: await isSignedIn() },
    /* Per-visitor and changes on login: never store this anywhere. */
    { headers: { "Cache-Control": "no-store" } },
  )
}

export async function POST(request: Request) {
  let code = ""

  try {
    const body = (await request.json()) as { code?: unknown }
    code = typeof body.code === "string" ? body.code.trim() : ""
  } catch {
    return NextResponse.json(
      { ok: false, signedIn: false, message: "\u062f\u0631\u062e\u0648\u0627\u0633\u062a \u0646\u0627\u0645\u0639\u062a\u0628\u0631 \u0628\u0648\u062f." },
      { status: 400 },
    )
  }

  /* Checked here as well as in the field: a paste can carry an invisible
     character, and a wasted round trip burns one of ten attempts a minute.
     Nothing is lowercased - the code is case-sensitive. */
  if (!CODE_PATTERN.test(code)) {
    return NextResponse.json(
      {
        ok: false,
        signedIn: false,
        message:
          "\u06a9\u062f \u0628\u0627\u06cc\u062f \u06f3\u06f2 \u0646\u0648\u06cc\u0633\u0647 \u0628\u0627\u0634\u062f \u0648 \u0641\u0642\u0637 \u062d\u0631\u0648\u0641 \u0644\u0627\u062a\u06cc\u0646\u060c \u0639\u062f\u062f\u060c \u062e\u0637 \u062a\u06cc\u0631\u0647 \u0648 \u0632\u06cc\u0631\u062e\u0637 \u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u062f.",
        length: code.length,
        expected: CODE_LENGTH,
      },
      { status: 400 },
    )
  }

  try {
    const session = await exchangeToken(code)

    if (!session?.access_token) {
      return NextResponse.json(
        {
          ok: false,
          signedIn: false,
          message: "\u067e\u0627\u0633\u062e \u0633\u0631\u0648\u0631 \u0646\u0627\u0642\u0635 \u0628\u0648\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
        },
        { status: 502 },
      )
    }

    await setSessionToken(session.access_token)

    return NextResponse.json({
      ok: true,
      signedIn: true,
      user_id: session.user_id,
      first_name: session.first_name,
      username: session.username,
    })
  } catch (error) {
    /* A failed exchange must never leave a half-session behind. */
    await clearSession()

    if (error instanceof ApiError) {
      /* A bad code is the expected failure, and it has three causes under one
         error code: mistyped, expired, or already used. Name all three. */
      if (error.code === "INVALID_LOGIN_TOKEN" || error.isAuth) {
        return NextResponse.json(
          {
            ok: false,
            signedIn: false,
            message:
              "\u06a9\u062f \u062f\u0631\u0633\u062a \u0646\u0628\u0648\u062f\u060c \u06cc\u0627 \u0645\u0646\u0642\u0636\u06cc \u0634\u062f\u0647\u060c \u06cc\u0627 \u067e\u06cc\u0634\u200c\u062a\u0631 \u06cc\u06a9 \u0628\u0627\u0631 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0634\u062f\u0647 \u0627\u0633\u062a. \u0627\u0632 \u0631\u0628\u0627\u062a \u06a9\u062f \u062a\u0627\u0632\u0647 \u0628\u06af\u06cc\u0631\u06cc\u062f.",
          },
          { status: 401 },
        )
      }

      /* Unreachable API, refused TLS, or our own timeout. Not the user's
         fault and not a bug in their code, so it says so plainly instead of
         appearing as a generic 500 - which is what made the first staging
         outage look like a broken login. */
      if (error.code === "NETWORK_ERROR" || error.code === "BAD_RESPONSE") {
        return NextResponse.json(
          {
            ok: false,
            signedIn: false,
            message:
              "\u0633\u0631\u0648\u0631 \u0647\u0648\u06cc\u062a \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u0646\u06cc\u0633\u062a. \u06a9\u062f \u0634\u0645\u0627 \u0633\u0627\u0644\u0645 \u0627\u0633\u062a\u061b \u0686\u0646\u062f \u0644\u062d\u0637\u0647 \u0628\u0639\u062f \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        { ok: false, signedIn: false, message: error.userMessage },
        { status: error.status || 500 },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        signedIn: false,
        message: "\u0645\u0634\u06a9\u0644\u06cc \u067e\u06cc\u0634 \u0622\u0645\u062f. \u06a9\u0645\u06cc \u0628\u0639\u062f \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
      },
      { status: 500 },
    )
  }
}

/**
 * Sign out. The backend is stateless, so there is nothing to revoke upstream -
 * the JWT stays technically valid until it expires. What we can do is stop
 * carrying it, completely, including the flag cookie older builds left behind.
 */
export async function DELETE() {
  await clearSession()
  return NextResponse.json({ ok: true, signedIn: false })
}
