import { removeOwnedBusinessCover, replaceOwnedBusinessCover } from "@/lib/api/owned-businesses"
import { ApiError } from "@/lib/api/types"
import { getSessionToken } from "@/lib/session"
import { ownerError, ownerResponse } from "../../response"

type Context = { params: Promise<{ id: string }> }
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_BODY_BYTES = MAX_FILE_BYTES + 64 * 1024

async function handle(request: Request, context: Context, remove: boolean) {
  const token = await getSessionToken()
  if (!token) return ownerResponse({ ok: false, signedIn: false }, 401)
  const { id: raw } = await context.params
  const id = Number(raw)
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) {
    return ownerResponse({ ok: false, signedIn: true, message: "کسب‌وکار پیدا نشد." }, 404)
  }
  const origin = request.headers.get("origin")
  if (origin) {
    try {
      const source = new URL(origin)
      const expectedHost = request.headers.get("host") ?? new URL(request.url).host
      if (!["http:", "https:"].includes(source.protocol) || source.host !== expectedHost) throw new Error("Cross-origin request")
    } catch {
      return ownerResponse({ ok: false, signedIn: true, message: "درخواست معتبر نیست." }, 403)
    }
  }
  try {
    let expectedUpdatedAt: string | null
    let file: File | null = null
    if (remove) {
      expectedUpdatedAt = new URL(request.url).searchParams.get("expected_updated_at")
    } else {
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
        return ownerResponse({ ok: false, signedIn: true, message: "فایل عکس را انتخاب کنید." }, 400)
      }
      // Bound the actual stream as well as Content-Length before parsing multipart.
      if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) {
        return ownerResponse({ ok: false, signedIn: true, message: "حجم عکس باید حداکثر ۵ مگابایت باشد." }, 413)
      }
      const reader = request.body?.getReader()
      if (!reader) return ownerResponse({ ok: false, signedIn: true, message: "فایل عکس دریافت نشد." }, 400)
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const part = await reader.read()
        if (part.done) break
        size += part.value.byteLength
        if (size > MAX_BODY_BYTES) {
          await reader.cancel()
          return ownerResponse({ ok: false, signedIn: true, message: "حجم عکس باید حداکثر ۵ مگابایت باشد." }, 413)
        }
        chunks.push(part.value)
      }
      let form: FormData
      try {
        const bytes = new Uint8Array(size)
        let offset = 0
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
        form = await new Response(bytes, { headers: { "Content-Type": request.headers.get("content-type")! } }).formData()
      } catch {
        return ownerResponse({ ok: false, signedIn: true, message: "فایل عکس معتبر نیست." }, 400)
      }
      const value = form.get("file")
      if (!(value instanceof File) || !value.size || value.size > MAX_FILE_BYTES) {
        return ownerResponse({ ok: false, signedIn: true, message: "یک عکس با حجم حداکثر ۵ مگابایت انتخاب کنید." }, 413)
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(value.type)) {
        return ownerResponse({ ok: false, signedIn: true, message: "عکس باید JPEG، PNG یا WebP باشد." }, 422)
      }
      file = value
      const timestamp = form.get("expected_updated_at")
      expectedUpdatedAt = typeof timestamp === "string" ? timestamp : null
    }
    if (!expectedUpdatedAt || expectedUpdatedAt.length > 80 || !Number.isFinite(Date.parse(expectedUpdatedAt))) {
      return ownerResponse({ ok: false, signedIn: true, message: "صفحه را تازه کنید و دوباره تلاش کنید." }, 422)
    }
    const data = remove
      ? await removeOwnedBusinessCover(token, id, expectedUpdatedAt)
      : await replaceOwnedBusinessCover(token, id, file!, expectedUpdatedAt)
    return ownerResponse({ ok: true, signedIn: true, data })
  } catch (error) {
    if (error instanceof ApiError && ![401, 404, 409].includes(error.status)) {
      const message = error.status === 413 ? "حجم عکس باید حداکثر ۵ مگابایت باشد."
        : error.status === 422 ? "عکس معتبر نیست. یک عکس JPEG، PNG یا WebP دیگر انتخاب کنید."
        : "عکس ذخیره نشد. کمی بعد دوباره تلاش کنید."
      return ownerResponse({ ok: false, signedIn: true, message }, error.status || 502)
    }
    return ownerError(error)
  }
}

export const POST = (request: Request, context: Context) => handle(request, context, false)
export const DELETE = (request: Request, context: Context) => handle(request, context, true)
