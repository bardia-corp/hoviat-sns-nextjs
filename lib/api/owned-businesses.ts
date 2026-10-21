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
