"use server"

import { revalidatePath } from "next/cache"
import { addBookmark, removeBookmark } from "@/lib/api/bookmarks"
import { ApiError } from "@/lib/api/types"
import { clearSession, getSessionToken } from "@/lib/session"

/**
 * Bookmarking, from a client component.
 *
 * A server action rather than a fetch from the browser, so the JWT stays in
 * the httpOnly cookie. The card updates optimistically and calls this; if the
 * result comes back not-ok the card rolls its own state back, which is why the
 * return type carries a reason rather than just throwing.
 */

export type BookmarkResult = {
  ok: boolean
  bookmarked: boolean
  /** "auth" means the session is gone and the UI should send them to login. */
  reason?: "auth" | "error"
  message?: string
}

export async function setBookmark(
  userId: number,
  next: boolean,
): Promise<BookmarkResult> {
  const token = await getSessionToken()

  if (!token) {
    /* Sheds the readable flag cookie an older build may have left behind, so
       no browser can go on believing in a session that is not there. */
    await clearSession()

    return {
      ok: false,
      bookmarked: !next,
      reason: "auth",
      message: "\u0628\u0631\u0627\u06cc \u0630\u062e\u06cc\u0631\u0647 \u06a9\u0631\u062f\u0646 \u0648\u0627\u0631\u062f \u0634\u0648\u06cc\u062f.",
    }
  }

  try {
    const bookmarked = next
      ? await addBookmark(token, userId)
      : await removeBookmark(token, userId)

    /* The bookmarks page is server-rendered from the API, so it has to be
       told the list changed. Nothing else reads bookmark state on the server,
       so nothing else is invalidated. */
    revalidatePath("/bookmarks")

    return { ok: true, bookmarked }
  } catch (error) {
    if (error instanceof ApiError) {
      /* A refused token ends the session here, on the same call that reports
         it. Saying "sign in first" while leaving the cookie in place is what
         left the app insisting the user was already signed in. */
      if (error.isAuth) await clearSession()

      return {
        ok: false,
        bookmarked: !next,
        reason: error.isAuth ? "auth" : "error",
        message: error.userMessage,
      }
    }
    return {
      ok: false,
      bookmarked: !next,
      reason: "error",
      message: "\u0630\u062e\u06cc\u0631\u0647 \u0646\u0634\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
    }
  }
}
