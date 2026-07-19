const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) return geocodeCache.get(address)!

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'User-Agent': 'JalSetu/1.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache.set(address, coords)
      return coords
    }
    geocodeCache.set(address, null)
    return null
  } catch {
    return null
  }
}
