import { NextResponse } from "next/server"
import { API_BASE, apiRequest } from "@/lib/api/http"
import { ApiError, type Session } from "@/lib/api/types"
import { setSessionToken } from "@/lib/session"

const LOOPBACK = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])
const reply = (body: unknown, status = 200) => NextResponse.json(body, {
  status, headers: { "Cache-Control": "no-store" },
})

function devLoginAccess(request: Request): { origin: string | null } | null {
  try {
    const host = request.headers.get("host") ?? new URL(request.url).host
    if (!LOOPBACK.has(new URL(API_BASE).hostname)) return null
    if (LOOPBACK.has(new URL("http://" + host).hostname)) return { origin: null }

    // Server-only opt-in for a preview protected by the deployment's access gate.
    const configuredOrigin = process.env.SNS_DEV_LOGIN_ORIGIN
    if (!configuredOrigin) return null
    const preview = new URL(configuredOrigin)
    if (preview.protocol !== "https:" || preview.origin !== configuredOrigin || LOOPBACK.has(preview.hostname)) return null
    return host === preview.host ? { origin: configuredOrigin } : null
  } catch { return null }
}

export async function GET(request: Request) {
  if (!devLoginAccess(request)) return reply({ enabled: false })
  try {
    const { data } = await apiRequest<{ enabled: boolean }>("/auth/dev-login", { timeoutMs: 3000 })
    return reply({ enabled: data?.enabled === true })
  } catch { return reply({ enabled: false }) }
}

export async function POST(request: Request) {
  const access = devLoginAccess(request)
  if (!access) return reply({ ok: false, message: "ورود توسعه در دسترس نیست." }, 404)
  const origin = request.headers.get("origin")
  try {
    const host = request.headers.get("host") ?? new URL(request.url).host
    if (access.origin ? origin !== access.origin : origin && new URL(origin).host !== host) return reply({ ok: false }, 403)
  } catch { return reply({ ok: false }, 403) }
  let userId: string | undefined
  try {
    const raw = await request.text()
    const input = raw ? JSON.parse(raw) : {}
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => key !== "user_id")) throw new Error("Invalid body")
    if (input.user_id !== undefined && input.user_id !== null && input.user_id !== "") {
      userId = String(input.user_id).trim()
      if (!/^-?[0-9]{1,19}$/.test(userId) || BigInt(userId) < BigInt("-9223372036854775808") || BigInt(userId) > BigInt("9223372036854775807")) throw new Error("Invalid ID")
    }
  } catch { return reply({ ok: false, message: "شناسهٔ کاربر باید یک عدد صحیح معتبر باشد." }, 422) }
  try {
    const { data } = await apiRequest<Session>("/auth/dev-login", { method: "POST", body: userId ? { user_id: userId } : {} })
    if (!data?.access_token) return reply({ ok: false, message: "پاسخ ورود کامل نیست." }, 502)
    await setSessionToken(data.access_token)
    return reply({ ok: true, signedIn: true })
  } catch (error) {
    const status = error instanceof ApiError ? error.status || 503 : 503
    return reply({ ok: false, message: status === 404 && userId ? "این شناسه در پایگاه دادهٔ محلی وجود ندارد، یا ورود توسعه غیرفعال است." : status === 403 ? "ورود به این حساب مجاز نیست." : "ورود توسعه انجام نشد. تنظیمات حالت توسعه و اتصال به API را بررسی کنید." }, status)
  }
}
