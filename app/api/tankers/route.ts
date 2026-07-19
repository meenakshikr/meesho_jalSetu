import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { haversineDistance } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')

    const { data: tankers, error } = await supabase
      .from('tankers')
      .select('*')
      .eq('is_available', true)
      .order('price_per_liter', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const tankersWithDistance = tankers.map((tanker) => ({
      ...tanker,
      distance_km: lat && lng
        ? Math.round(haversineDistance(lat, lng, tanker.current_lat, tanker.current_lng) * 10) / 10
        : null,
    }))

    return NextResponse.json(tankersWithDistance)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can create tankers' }, { status: 403 })
    }

    const body = await request.json()
    const { operator_name, vehicle_number, capacity_liters, price_per_liter, current_lat, current_lng } = body

    const { data: tanker, error } = await supabase
      .from('tankers')
      .insert({
        owner_id: profile.id,
        operator_name,
        vehicle_number,
        capacity_liters,
        price_per_liter,
        current_lat: current_lat || 0,
        current_lng: current_lng || 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tanker, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
