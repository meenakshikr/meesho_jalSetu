import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { searchParams } = new URL(request.url)
    const wardId = searchParams.get('ward_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const residentId = searchParams.get('resident_id')

    let query = supabase
      .from('bookings')
      .select('*, tanker:tankers(*), coordinator:users!bookings_coordinator_id_fkey(*), resident:users!bookings_resident_id_fkey(*), participants:booking_participants(*, user:users(name,phone))')
      .order('created_at', { ascending: false })

    if (wardId) query = query.eq('ward_id', wardId)
    if (status) query = query.eq('status', status)
    if (type) query = query.eq('type', type)
    if (residentId) query = query.eq('resident_id', residentId)

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(bookings)
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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      type, tanker_id, ward_id, volume_ordered, price_per_liter: requestedPrice,
      delivery_address, delivery_lat, delivery_lng, scheduled_at
    } = body

    let lat = delivery_lat
    let lng = delivery_lng

    if (!lat && !lng && delivery_address) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(delivery_address)}&limit=1`,
          { headers: { 'User-Agent': 'JalSetu/1.0' } }
        )
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (geoData?.[0]) {
            lat = parseFloat(geoData[0].lat)
            lng = parseFloat(geoData[0].lon)
          }
        }
      } catch { }
    }

    let price_per_liter = requestedPrice
    if (!price_per_liter && tanker_id) {
      const { data: tanker } = await supabase.from('tankers').select('price_per_liter').eq('id', tanker_id).single()
      price_per_liter = tanker?.price_per_liter ?? 0
    }

    if (!volume_ordered || volume_ordered < 5000 || volume_ordered > 12000) {
      return NextResponse.json({ error: 'Volume must be between 5000L and 12000L' }, { status: 400 })
    }

    const total_amount = volume_ordered * price_per_liter

    const bookingData: Record<string, unknown> = {
      type,
      status: type === 'community' ? 'open' : 'pending',
      tanker_id,
      ward_id: ward_id || profile.ward_id,
      resident_id: profile.id,
      volume_ordered,
      price_per_liter,
      total_amount,
      delivery_address,
      delivery_lat: lat,
      delivery_lng: lng,
      scheduled_at,
    }

    if (type === 'community') {
      bookingData.coordinator_id = profile.id
      bookingData.status = 'open'
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (type === 'community') {
      await supabase.from('booking_participants').insert({
        booking_id: booking.id,
        user_id: profile.id,
        share_liters: 0,
        share_amount: 0,
        payment_status: 'pending',
      })
    }

    return NextResponse.json(booking, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
