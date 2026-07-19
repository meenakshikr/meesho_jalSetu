import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        coordinator:users!bookings_coordinator_id_fkey(id, name, phone),
        tanker:tankers(id, operator_name, capacity_liters, vehicle_number)
      `)
      .eq('type', 'community')
      .eq('status', 'open')
      .eq('ward_id', profile.ward_id)
      .order('scheduled_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const bookingsWithCounts = await Promise.all(
      (bookings || []).map(async (booking) => {
        const { count } = await supabase
          .from('booking_participants')
          .select('*', { count: 'exact', head: true })
          .eq('booking_id', booking.id)

        const { data: myParticipation } = await supabase
          .from('booking_participants')
          .select('id, share_liters, payment_status')
          .eq('booking_id', booking.id)
          .eq('user_id', profile.id)
          .maybeSingle()

        return {
          ...booking,
          participant_count: count || 0,
          my_participation: myParticipation || null,
        }
      })
    )

    return NextResponse.json(bookingsWithCounts)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
