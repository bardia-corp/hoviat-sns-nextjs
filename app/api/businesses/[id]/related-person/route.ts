import { NextResponse } from "next/server"
import { getBusinessRelatedPerson } from "@/lib/api/businesses"
import { ApiError } from "@/lib/api/types"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } })
  if (!Number.isSafeInteger(id) || id < 1) return response({ ok: false }, 404)
  try { return response({ ok: true, data: await getBusinessRelatedPerson(id) }) }
  catch (error) { return response({ ok: false, message: "اطلاعات فرد مرتبط دریافت نشد." }, error instanceof ApiError ? error.status || 503 : 503) }
}
