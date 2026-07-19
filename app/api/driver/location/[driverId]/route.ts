import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const supabase = createSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('history') === 'true'

    const { data: location, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', params.driverId)
      .single()

    if (error || !location) {
      return NextResponse.json({ location: null })
    }

    let history: Record<string, unknown>[] = []
    if (includeHistory) {
      const { data } = await supabase
        .from('driver_location_history')
        .select('*')
        .eq('driver_id', params.driverId)
        .order('recorded_at', { ascending: false })
        .limit(100)
      history = data || []
    }

    return NextResponse.json({ location, history })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
