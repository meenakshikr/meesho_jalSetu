import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    const body = await request.json()
    const { driver_id, lat, lng, booking_id } = body

    if (!driver_id || lat == null || lng == null) {
      return NextResponse.json({ error: 'driver_id, lat, lng are required' }, { status: 400 })
    }

    const { error: upsertErr } = await supabase
      .from('driver_locations')
      .upsert(
        {
          driver_id,
          lat,
          lng,
          booking_id: booking_id || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'driver_id' }
      )

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    await supabase.from('driver_location_history').insert({
      driver_id,
      lat,
      lng,
      booking_id: booking_id || null,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
