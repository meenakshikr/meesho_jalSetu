import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driver_id')

    let query = supabase
      .from('tankers')
      .select('*, driver:users!tankers_driver_id_fkey(name, phone)')

    if (driverId) {
      query = query.eq('driver_id', driverId)
    }

    const { data: tankers, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tankers)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
