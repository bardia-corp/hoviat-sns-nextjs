import { getBusinessLocationCatalogue } from "@/lib/api/businesses"
import { getSessionToken } from "@/lib/session"
import { ownerError, ownerResponse } from "../response"

export async function GET() {
  if (!await getSessionToken()) return ownerResponse({ ok: false, signedIn: false }, 401)
  try { return ownerResponse({ ok: true, data: await getBusinessLocationCatalogue() }) }
  catch (error) { return ownerError(error) }
}
