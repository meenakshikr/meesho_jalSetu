import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const tankerId = searchParams.get('tanker_id')
    const tankerIds = searchParams.get('tanker_ids')
    const driverId = searchParams.get('driver_id')

    let query = supabase
      .from('bookings')
      .select('*, tanker:tankers(*), resident:users!bookings_resident_id_fkey(*)')
      .order('created_at', { ascending: false })

    if (driverId) {
      query = query.eq('driver_id', driverId)
    } else if (tankerId) {
      query = query.eq('tanker_id', tankerId)
    } else if (tankerIds) {
      const ids = tankerIds.split(',')
      query = query.in('tanker_id', ids)
    }

    const { data: bookings, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(bookings)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
