"use server"

import { revalidatePath } from "next/cache"
import {
  deleteAvatar,
  replaceSocialLinks,
  updatePrivacy,
  updateProfile,
  uploadAvatar,
} from "@/lib/api/account"
import { ApiError, type PrivacyPatch, type ProfilePatch, type SocialLink } from "@/lib/api/types"
import { toApiLink } from "@/lib/social"
import { clearSession, getSessionToken } from "@/lib/session"

/**
 * Every write to the signed-in user's own account.
 *
 * All of them share one result shape so the editors on the profile page can
 * show one inline message pattern instead of inventing three. An expired JWT
 * is reported as reason "auth" rather than as a generic failure, because the
 * only cure is logging in again and the UI has to say so.
 */

export type SaveResult = {
  ok: boolean
  reason?: "auth" | "invalid" | "error"
  message?: string
}

async function withToken(
  run: (token: string) => Promise<unknown>,
): Promise<SaveResult> {
  const token = await getSessionToken()

  if (!token) {
    await clearSession()

    return {
      ok: false,
      reason: "auth",
      message: "\u0646\u0634\u0633\u062a \u0634\u0645\u0627 \u062a\u0645\u0627\u0645 \u0634\u062f\u0647 \u0627\u0633\u062a. \u062f\u0648\u0628\u0627\u0631\u0647 \u0648\u0627\u0631\u062f \u0634\u0648\u06cc\u062f.",
    }
  }

  try {
    await run(token)
    /* The profile page reads /account/me on the server, so it must re-render
       after any write. */
    revalidatePath("/profile")
    return { ok: true }
  } catch (error) {
    if (error instanceof ApiError) {
      /* Same rule as everywhere else: a rejected token is destroyed on the
         spot, so the next check tells the truth. */
      if (error.isAuth) await clearSession()

      return {
        ok: false,
        reason: error.isAuth
          ? "auth"
          : error.code === "INVALID_INPUT"
            ? "invalid"
            : "error",
        message: error.userMessage,
      }
    }
    return {
      ok: false,
      reason: "error",
      message: "\u0630\u062e\u06cc\u0631\u0647 \u0646\u0634\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
    }
  }
}

/* An empty text box means "clear this field", which the API expresses as an
   explicit null. Sending "" instead would store an empty string, and the
   difference shows up as a blank line on the public profile. */
function orNull(value: string | undefined): string | null {
  const trimmed = (value ?? "").trim()
  return trimmed === "" ? null : trimmed
}

export async function saveProfile(input: {
  nickname?: string
  first_name?: string
  last_name?: string
  bio?: string
  occupation?: string
  country?: string
  whatsapp_number?: string
}): Promise<SaveResult> {
  /* Only fields PATCH /account/profile accepts. Anything else is a
     400, so the payload is built explicitly rather than spread. username is
     absent on purpose: it comes from Telegram and cannot be changed. */
  const patch: ProfilePatch = {}
  if (Object.prototype.hasOwnProperty.call(input, "nickname")) {
    const name = input.nickname?.trim() ?? ""
    if (!name || name.length > 200) return { ok: false, reason: "invalid", message: "نام شما باید بین ۱ تا ۲۰۰ نویسه باشد." }
    patch.nickname = name
  }
  for (const key of ["first_name", "last_name", "bio", "occupation", "country", "whatsapp_number"] as const) {
    if (Object.prototype.hasOwnProperty.call(input, key)) patch[key] = orNull(input[key])
  }

  return withToken((token) => updateProfile(token, patch))
}

export async function savePrivacy(patch: PrivacyPatch): Promise<SaveResult> {
  return withToken((token) => updatePrivacy(token, patch))
}

/**
 * Replace-all, as the API requires: the array sent becomes the entire list.
 * The editor therefore always submits every row it holds, and an empty array
 * deletes them all.
 */
export async function saveSocialLinks(
  rows: Array<{ platform: string; handle: string; label?: string | null }>,
): Promise<SaveResult> {
  const links = rows
    .filter((row) => row.platform && row.handle.trim())
    .map((row) => toApiLink(row))

  return withToken((token) => replaceSocialLinks(token, links))
}

/** Preserve existing links outside the guided contact templates verbatim. */
export async function saveContactLinks(links: SocialLink[]): Promise<SaveResult> {
  return withToken((token) => replaceSocialLinks(token, links))
}

export async function saveAvatar(form: FormData): Promise<SaveResult> {
  const file = form.get("file")

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, reason: "invalid", message: "\u0641\u0627\u06cc\u0644\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0646\u0634\u062f." }
  }

  /* Checked here as well as in the input's accept attribute: the API rejects
     anything over 5MB or outside these three types, and a local check saves a
     slow upload that ends in a 413. */
  if (file.size > 5 * 1024 * 1024) {
    return {
      ok: false,
      reason: "invalid",
      message: "\u062d\u062c\u0645 \u062a\u0635\u0648\u06cc\u0631 \u0628\u0627\u06cc\u062f \u06a9\u0645\u062a\u0631 \u0627\u0632 \u06f5 \u0645\u06af\u0627\u0628\u0627\u06cc\u062a \u0628\u0627\u0634\u062f.",
    }
  }

  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return {
      ok: false,
      reason: "invalid",
      message: "\u0641\u0642\u0637 JPEG\u060c PNG \u06cc\u0627 WebP \u067e\u0630\u06cc\u0631\u0641\u062a\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f.",
    }
  }

  return withToken((token) => uploadAvatar(token, file))
}

export async function removeAvatar(): Promise<SaveResult> {
  return withToken((token) => deleteAvatar(token))
}

/**
 * Sign out. The JWT itself stays valid until it expires - the backend is
 * stateless - so all that happens here is that we stop carrying it.
 *
 * This used to delete the token cookie and leave the readable flag cookie
 * behind, which meant signing out from the profile page left the interface
 * convinced you were still signed in. clearSession removes both.
 */
export async function signOutAction(): Promise<SaveResult> {
  await clearSession()
  revalidatePath("/")
  return { ok: true }
}
