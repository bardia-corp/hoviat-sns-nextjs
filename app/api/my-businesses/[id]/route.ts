import { getOwnedBusiness, updateOwnedBusiness } from "@/lib/api/owned-businesses"
import type { OwnedBusinessPatch } from "@/lib/api/owned-business-types"
import { getSessionToken } from "@/lib/session"
import { ownerError, ownerResponse } from "../response"

type Context = { params: Promise<{ id: string }> }

async function handle(request: Request, context: Context, write: boolean) {
  const token = await getSessionToken()
  if (!token) return ownerResponse({ ok: false, signedIn: false }, 401)
  const { id: raw } = await context.params
  const id = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) {
    return ownerResponse({ ok: false, signedIn: true, message: "کسب‌وکار پیدا نشد." }, 404)
  }
  if (write) {
    const origin = request.headers.get("origin")
    if (origin) {
      // Next may construct request.url with localhost behind a proxy even
      // when the browser used 127.0.0.1 or the deployment's public hostname.
      const expectedHost = request.headers.get("host") ?? new URL(request.url).host
      try {
        const source = new URL(origin)
        if (!["http:", "https:"].includes(source.protocol) || source.host !== expectedHost) throw new Error("Cross-origin request")
      } catch {
        return ownerResponse({ ok: false, signedIn: true, message: "درخواست معتبر نیست." }, 403)
      }
    }
  }
  try {
    let data
    if (write) {
      let body: OwnedBusinessPatch
      try { body = await request.json() as OwnedBusinessPatch } catch {
        return ownerResponse({ ok: false, signedIn: true, message: "اطلاعات فرم معتبر نیست." }, 400)
      }
      data = await updateOwnedBusiness(token, id, body)
    } else {
      data = await getOwnedBusiness(token, id)
    }
    return ownerResponse({ ok: true, signedIn: true, data })
  } catch (error) {
    return ownerError(error)
  }
}

export const GET = (request: Request, context: Context) => handle(request, context, false)
export const PATCH = (request: Request, context: Context) => handle(request, context, true)
