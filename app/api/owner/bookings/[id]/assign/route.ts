import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase-server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const serviceRole = createSupabaseServiceRole()

    const { data: profile } = await serviceRole
      .from('users')
      .select('*')
      .eq('auth_id', user.id)
      .single()

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { driver_id } = body

    if (!driver_id) {
      return NextResponse.json({ error: 'driver_id is required' }, { status: 400 })
    }

    const { data: booking, error: bookingErr } = await serviceRole
      .from('bookings')
      .select('*, tanker:tankers(owner_id)')
      .eq('id', params.id)
      .single()

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.tanker?.owner_id !== profile.id) {
      return NextResponse.json({ error: 'This booking does not belong to your fleet' }, { status: 403 })
    }

    const { data: driver } = await serviceRole
      .from('users')
      .select('id, role')
      .eq('id', driver_id)
      .single()

    if (!driver || driver.role !== 'driver') {
      return NextResponse.json({ error: 'Invalid driver' }, { status: 400 })
    }

    const { data: updated, error: updateErr } = await serviceRole
      .from('bookings')
      .update({
        driver_id,
        status: 'confirmed',
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
