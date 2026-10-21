import { listOwnedBusinesses } from "@/lib/api/owned-businesses"
import { getSessionToken } from "@/lib/session"
import { ownerError, ownerResponse } from "./response"

export async function GET(request: Request) {
  const token = await getSessionToken()
  if (!token) return ownerResponse({ ok: false, signedIn: false }, 401)
  const raw = new URL(request.url).searchParams.get("page") ?? "1"
  const page = Number(raw)
  if (!Number.isSafeInteger(page) || page < 1) {
    return ownerResponse({ ok: false, signedIn: true, message: "شماره صفحه معتبر نیست." }, 400)
  }
  try {
    return ownerResponse({ ok: true, signedIn: true, data: await listOwnedBusinesses(token, page) })
  } catch (error) {
    return ownerError(error)
  }
}
