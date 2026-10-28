import "server-only"
import { apiRequest } from "./http"
import type { OwnedBusiness, OwnedBusinessList, OwnedBusinessPatch } from "./owned-business-types"

export async function listOwnedBusinesses(token: string, page: number): Promise<OwnedBusinessList> {
  const { data, meta } = await apiRequest<OwnedBusiness[]>("/me/services", {
    token, query: { page, size: 12 },
  })
  return {
    items: data ?? [],
    meta: {
      total: Number(meta.total ?? 0), page: Number(meta.page ?? page),
      size: Number(meta.size ?? 12), pages: Number(meta.pages ?? 1),
    },
  }
}

export async function getOwnedBusiness(token: string, id: number): Promise<OwnedBusiness> {
  return (await apiRequest<OwnedBusiness>(`/me/services/${id}`, { token })).data
}

export async function updateOwnedBusiness(token: string, id: number, body: OwnedBusinessPatch): Promise<OwnedBusiness> {
  return (await apiRequest<OwnedBusiness>(`/me/services/${id}`, { token, method: "PATCH", body })).data
}

export async function replaceOwnedBusinessCover(token: string, id: number, file: File, expectedUpdatedAt: string): Promise<OwnedBusiness> {
  const form = new FormData()
  form.append("file", file)
  form.append("expected_updated_at", expectedUpdatedAt)
  return (await apiRequest<OwnedBusiness>(`/me/services/${id}/cover-image`, {
    token, method: "POST", form, timeoutMs: 30000,
  })).data
}

export async function removeOwnedBusinessCover(token: string, id: number, expectedUpdatedAt: string): Promise<OwnedBusiness> {
  return (await apiRequest<OwnedBusiness>(`/me/services/${id}/cover-image`, {
    token, method: "DELETE", query: { expected_updated_at: expectedUpdatedAt }, timeoutMs: 30000,
  })).data
}
