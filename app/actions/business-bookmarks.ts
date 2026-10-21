"use server"

import { updateBusinessBookmark } from "@/lib/api/businesses"
import { ApiError } from "@/lib/api/types"
import { clearSession, getSessionToken } from "@/lib/session"

export async function setBusinessBookmark(id: number, next: boolean) {
  const token = await getSessionToken()
  if (!token) return { ok: false, reason: "auth", message: "برای ذخیره کردن وارد شوید." }
  if (!Number.isSafeInteger(id) || id <= 0 || typeof next !== "boolean") {
    return { ok: false, reason: "error", message: "کسب‌وکار معتبر نیست." }
  }
  try {
    const bookmarked = await updateBusinessBookmark(token, id, next)
    return { ok: true, bookmarked }
  } catch (error) {
    const api = error instanceof ApiError ? error : null
    if (api?.isAuth) await clearSession()
    return { ok: false, reason: api?.isAuth ? "auth" : "error", message: api?.userMessage ?? "ذخیره نشد. دوباره تلاش کنید." }
  }
}
