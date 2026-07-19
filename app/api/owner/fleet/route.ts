import { NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET() {
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
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const serviceRole = createSupabaseServiceRole()

    const { data: tankers, error } = await serviceRole
      .from('tankers')
      .select('*, driver:users!tankers_driver_id_fkey(name, phone)')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!tankers || tankers.length === 0) {
      return NextResponse.json({ tankers: [], anomalies: [] })
    }

    const tankerIds = tankers.map((t) => t.id)

    const { data: anomalies } = await serviceRole
      .from('anomaly_logs')
      .select('*')
      .in('tanker_id', tankerIds)
      .eq('resolved', false)

    return NextResponse.json({ tankers, anomalies: anomalies || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
