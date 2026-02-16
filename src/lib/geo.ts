export type LatLng = { lat: number; lng: number }

export function extractCoordsFromText(input: string): LatLng | null {
  if (!input) return null

  const toLatLng = (latRaw: string, lngRaw: string): LatLng | null => {
    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }

  // 1) raw "lat,lng" (most explicit)
  const simpleMatch = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
  if (simpleMatch) return toLatLng(simpleMatch[1], simpleMatch[2])

  // 2) q=lat,lng or ll=lat,lng or query=lat,lng
  const qMatch = input.match(/[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (qMatch) return toLatLng(qMatch[1], qMatch[2])

  // 3) !3dLAT!4dLNG (pb params) - often repeated; the last pair is usually the pinned place coordinates
  const pbPairs = Array.from(input.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g))
  if (pbPairs.length > 0) {
    const last = pbPairs[pbPairs.length - 1]
    const lat = last?.[1]
    const lng = last?.[2]
    if (lat && lng) return toLatLng(lat, lng)
  }

  // 3b) !2dLNG!3dLAT (alternate pb order) - take last pair as well
  const pbPairsAlt = Array.from(input.matchAll(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g))
  if (pbPairsAlt.length > 0) {
    const last = pbPairsAlt[pbPairsAlt.length - 1]
    const lng = last?.[1]
    const lat = last?.[2]
    if (lat && lng) return toLatLng(lat, lng)
  }

  // 4) /search/lat,lng
  const searchMatch = input.match(/search\/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (searchMatch) return toLatLng(searchMatch[1], searchMatch[2])

  // 5) @lat,lng (often just map viewport/center, so keep as last resort)
  const atMatch = input.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
  if (atMatch) return toLatLng(atMatch[1], atMatch[2])

  return null
}

export function isShortGoogleMapsUrl(url: string) {
  return typeof url === 'string' && (url.includes('goo.gl') || url.includes('maps.app.goo.gl'))
}

export function formatLatLng(latLng: LatLng) {
  return `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`
}
