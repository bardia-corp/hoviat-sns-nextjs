import { NextResponse } from "next/server"
import { ApiError } from "@/lib/api/types"
import { clearSession } from "@/lib/session"

export function ownerResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

export async function ownerError(error: unknown) {
  const api = error instanceof ApiError ? error : null
  if (api?.isAuth) {
    await clearSession()
    return ownerResponse({ ok: false, signedIn: false, message: "نشست شما تمام شده است. دوباره وارد شوید." }, 401)
  }
  const status = api?.status || 502
  const message = status === 404
    ? "کسب‌وکار پیدا نشد یا دیگر به حساب شما اختصاص ندارد."
    : status === 409
      ? "اطلاعات این کسب‌وکار تغییر کرده است. نسخه تازه را بارگیری و دوباره ویرایش کنید."
      : status === 422
        ? "اطلاعات معتبر نیست. نام، کد کشور، موقعیت و روش‌های تماس را بررسی کنید."
        : api?.userMessage ?? "اطلاعات کسب‌وکار دریافت نشد. دوباره تلاش کنید."
  return ownerResponse({ ok: false, signedIn: true, message }, status)
}
