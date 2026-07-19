import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const district = searchParams.get('district')

    let query = supabase
      .from('heatwave_alerts')
      .select('*')
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())

    if (district) {
      query = query.eq('district', district)
    }

    const { data: alerts, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(alerts?.[0] || null)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
