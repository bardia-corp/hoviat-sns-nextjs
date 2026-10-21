import "server-only"
import { API_BASE, apiRequest } from "./http"
import { ApiError } from "./types"
import type { Business, BusinessCategory, BusinessLocation, BusinessSearchResult } from "./business-types"
import type { BusinessQuery } from "../business-search"
import type { RelatedBusinessPerson } from "./business-types"

const SERVICES_BASE = process.env.SERVICES_API_BASE ?? API_BASE.replace(/\/sns\/?$/, "/services")

export async function getBusinessRelatedPerson(id: number): Promise<RelatedBusinessPerson | null> {
  return (await apiRequest<RelatedBusinessPerson | null>(`/services/${id}/related-person/`, { baseUrl: SERVICES_BASE })).data
}

/** Always fresh: publication and contact visibility may change at any time. */
export async function searchBusinesses(query: BusinessQuery): Promise<BusinessSearchResult> {
  const { data, meta } = await apiRequest<Business[]>("/services/", {
    baseUrl: SERVICES_BASE,
    query: {
      ...query,
      country_code: query.country_code === "all" ? undefined : query.country_code,
      category: query.category.length ? query.category : undefined,
    },
  })
  const total = Number(meta.total) || 0
  return {
    data: Array.isArray(data) ? data : [],
    meta: { total, page: Number(meta.page) || query.page, size: Number(meta.size) || query.size, pages: Number(meta.pages) || Math.max(1, Math.ceil(total / query.size)) },
  }
}

export async function getBusiness(id: number): Promise<Business | null> {
  try {
    return (await apiRequest<Business>("/services/" + id + "/", { baseUrl: SERVICES_BASE })).data
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.code === "SERVICE_NOT_FOUND")) return null
    throw error
  }
}

export async function getBusinessCategories(countryCode = "DE"): Promise<BusinessCategory[]> {
  const { data } = await apiRequest<BusinessCategory[]>("/services/categories/", {
    baseUrl: SERVICES_BASE,
    query: { country_code: countryCode === "all" ? undefined : countryCode },
  })
  return Array.isArray(data) ? data : []
}

export async function getBusinessLocations(): Promise<BusinessLocation[]> {
  const { data } = await apiRequest<BusinessLocation[]>("/services/locations/", { baseUrl: SERVICES_BASE })
  return Array.isArray(data) ? data : []
}

/** Defined active locations, including cities without published listings. */
export async function getBusinessLocationCatalogue(): Promise<BusinessLocation[]> {
  const { data } = await apiRequest<BusinessLocation[]>("/services/location-catalogue/", { baseUrl: SERVICES_BASE })
  return Array.isArray(data) ? data : []
}

export async function getBusinessBookmarks(token: string): Promise<Business[]> {
  const { data } = await apiRequest<Business[]>("/me/service-bookmarks", { token })
  return Array.isArray(data) ? data : []
}

export async function updateBusinessBookmark(token: string, id: number, bookmarked: boolean): Promise<boolean> {
  const { data } = await apiRequest<{ service_id: number; bookmarked: boolean }>("/me/service-bookmarks/" + id, {
    token, method: bookmarked ? "POST" : "DELETE",
  })
  return data.bookmarked
}
