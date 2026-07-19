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

    const { data: tankers } = await serviceRole
      .from('tankers')
      .select('id')
      .eq('owner_id', profile.id)

    if (!tankers || tankers.length === 0) {
      return NextResponse.json([])
    }

    const tankerIds = tankers.map(t => t.id)

    const { data: bookings, error } = await serviceRole
      .from('bookings')
      .select(`
        *,
        tanker:tankers(id, operator_name, vehicle_number, capacity_liters),
        resident:users!bookings_resident_id_fkey(name, phone),
        coordinator:users!bookings_coordinator_id_fkey(name, phone),
        driver:users!bookings_driver_id_fkey(name, phone)
      `)
      .in('tanker_id', tankerIds)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(bookings || [])
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
