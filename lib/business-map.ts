import type { Business } from "./api/business-types"

type Location = Pick<Business, "google_maps_url" | "latitude" | "longitude" | "address" | "postal_code" | "city" | "state" | "country_code">
const googleHosts = new Set(["google.com", "www.google.com", "maps.google.com", "google.de", "www.google.de", "maps.google.de"])

function cleanQuery(value: string | null | undefined): string | null {
  const query = value?.trim()
  return query && query.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(query) ? query : null
}

function coordinateQuery(latitude: number | null, longitude: number | null): string | null {
  return typeof latitude === "number" && typeof longitude === "number" && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? `${latitude},${longitude}` : null
}

/** Never iframe an arbitrary URL or fetch/expand an imported short link. */
export function businessMap(location: Location): { href: string | null; embedSrc: string | null } {
  let original: URL | null = null
  if (location.google_maps_url) {
    try {
      const url = new URL(location.google_maps_url.trim())
      const short = url.hostname === "maps.app.goo.gl" || (url.hostname === "goo.gl" && url.pathname.startsWith("/maps/"))
      const googleMap = googleHosts.has(url.hostname) && (url.pathname === "/maps" || url.pathname.startsWith("/maps/") || url.hostname.startsWith("maps."))
      if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || (!short && !googleMap)) return { href: null, embedSrc: null }
      original = url
    } catch { return { href: null, embedSrc: null } }
  }

  // Support Google Maps' actual Share > Embed URLs without loading normal
  // sharing pages in an iframe (they may prohibit embedding).
  if (original && googleHosts.has(original.hostname) && original.pathname === "/maps/embed" && original.searchParams.get("pb")) {
    const embed = new URL("https://www.google.com/maps/embed")
    embed.searchParams.set("pb", original.searchParams.get("pb")!)
    return { href: original.href, embedSrc: embed.href }
  }

  const linkedQuery = original && googleHosts.has(original.hostname)
    ? cleanQuery(original.searchParams.get("query")) || cleanQuery(original.searchParams.get("q")) : null
  const coordinates = coordinateQuery(location.latitude, location.longitude)
  const address = cleanQuery(location.address)
  const fallback = coordinates || (address ? cleanQuery([address, location.postal_code, location.city, location.state, location.country_code].filter(Boolean).join(", ")) : null)
  const query = linkedQuery || fallback
  if (!query) return { href: original?.href || null, embedSrc: null }
  const embed = new URL("https://www.google.com/maps")
  embed.searchParams.set("q", query)
  embed.searchParams.set("output", "embed")
  embed.searchParams.set("hl", "fa")
  const generated = new URL("https://www.google.com/maps/search/")
  generated.searchParams.set("api", "1")
  generated.searchParams.set("query", query)
  return { href: original?.href || generated.href, embedSrc: embed.href }
}
