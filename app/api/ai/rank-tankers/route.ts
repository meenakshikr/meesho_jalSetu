import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'
import { callGeminiJSON } from '@/lib/gemini'

interface RankedTanker {
  id: string
  ai_rank_score: number
  ai_rank_reason: string
}

export async function POST(request: NextRequest) {
  try {
    const { ward_id, volume_needed, user_lat, user_lng } = await request.json()

    if (!ward_id) {
      return NextResponse.json({ error: 'ward_id is required' }, { status: 400 })
    }

    const supabase = createSupabaseServiceRole()

    const { data: tankers, error } = await supabase
      .from('tankers')
      .select('*')
      .eq('is_available', true)

    if (error || !tankers?.length) {
      return NextResponse.json({ tankers: [] })
    }

    const { data: ward } = await supabase
      .from('wards')
      .select('district')
      .eq('id', ward_id)
      .single()

    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('price_per_liter, wards!bookings_ward_id_fkey(district)')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(30)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const districtBookings = (recentBookings || []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (b: any) => b.wards?.district === ward?.district
    )

    const avgPrice = districtBookings.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? districtBookings.reduce((s: number, b: any) => s + b.price_per_liter, 0) / districtBookings.length
      : null

    const tankersWithDistance = tankers.map(t => ({
      ...t,
      distance_km: t.current_lat && user_lat
        ? haversine(user_lat, user_lng, t.current_lat, t.current_lng)
        : 99,
    }))

    const system = `You are JalSetu's water tanker ranking AI for India.
Rank tankers for a water delivery booking. Score each tanker from 0 to 100.

Scoring priority:
1. Price vs district average — lower price is better, penalize heavily if more than 40% above average
2. Rating out of 5 — higher is better
3. Distance in km — closer is better
4. Total deliveries — more experience is better
5. Certification status — certified gets bonus points

Return a JSON array with ALL tankers from the input, each object must have exactly these fields:
- id: string (copy exactly from input)
- ai_rank_score: number between 0 and 100
- ai_rank_reason: string of max 8 words explaining why this score`

    const user = `District average price per liter: ${avgPrice != null ? '₹' + avgPrice.toFixed(2) : 'unknown'}
Volume needed: ${volume_needed || 2000} liters
Tankers to rank: ${JSON.stringify(tankersWithDistance.map(t => ({
      id: t.id,
      operator_name: t.operator_name,
      vehicle_number: t.vehicle_number,
      capacity_liters: t.capacity_liters,
      price_per_liter: t.price_per_liter,
      rating: t.rating,
      total_deliveries: t.total_deliveries,
      distance_km: t.distance_km,
      is_certified: t.is_certified,
    })))}`

    const ranked = await callGeminiJSON<RankedTanker[]>(system, user)

    const rankedMap = new Map(ranked.map(r => [r.id, r]))
    const merged = tankersWithDistance.map(t => {
      const aiData = rankedMap.get(t.id)
      return {
        ...t,
        ai_rank_score: aiData?.ai_rank_score ?? 50,
        ai_rank_reason: aiData?.ai_rank_reason ?? 'Ranked by price and rating',
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).sort((a: any, b: any) => (b.ai_rank_score ?? 0) - (a.ai_rank_score ?? 0))

    return NextResponse.json({ tankers: merged })
  } catch (error) {
    console.error('rank-tankers error:', error)
    return NextResponse.json(
      { error: 'Tanker ranking failed', detail: String(error) },
      { status: 500 }
    )
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
