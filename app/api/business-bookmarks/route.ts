import { NextResponse } from "next/server"
import { getBusinessBookmarks } from "@/lib/api/businesses"
import { ApiError } from "@/lib/api/types"
import { clearSession, getSessionToken } from "@/lib/session"

export async function GET() {
  const token = await getSessionToken()
  const headers = { "Cache-Control": "private, no-store" }
  if (!token) return NextResponse.json({ ok: true, signedIn: false, data: [] }, { headers })
  try {
    const data = await getBusinessBookmarks(token)
    return NextResponse.json({ ok: true, signedIn: true, data }, { headers })
  } catch (error) {
    const api = error instanceof ApiError ? error : null
    if (api?.isAuth) await clearSession()
    return NextResponse.json({
      ok: false, signedIn: !api?.isAuth, message: api?.userMessage ?? "ذخیره‌ها خوانده نشدند.",
    }, { status: api?.status || 502, headers })
  }
}
