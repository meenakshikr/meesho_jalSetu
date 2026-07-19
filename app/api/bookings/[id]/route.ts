import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServiceRole()

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, tanker:tankers(*), coordinator:users!bookings_coordinator_id_fkey(*), resident:users!bookings_resident_id_fkey(*), driver:users!bookings_driver_id_fkey(*)')
      .eq('id', params.id)
      .single()

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const { data: participants } = await supabase
      .from('booking_participants')
      .select('*, user:users(*)')
      .eq('booking_id', params.id)

    return NextResponse.json({ ...booking, participants: participants || [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServiceRole()

    const body = await request.json()

    if (body.status === 'delivered') {
      body.delivered_at = new Date().toISOString()
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (body.status === 'delivered' && booking) {
      const { data: participants } = await supabase
        .from('booking_participants')
        .select('*')
        .eq('booking_id', params.id)

      if (participants) {
        const receipts = participants
          .filter((p) => p.share_liters > 0)
          .map((p) => ({
            booking_id: params.id,
            user_id: p.user_id,
            amount: p.share_amount,
            volume_liters: p.share_liters,
            tanker_id: booking.tanker_id,
            ward_id: booking.ward_id,
          }))

        if (receipts.length > 0) {
          await supabase.from('receipts').insert(receipts)
        }
      }
    }

    if (body.status === 'disputed' && booking) {
      const reason = body.anomaly_reason || 'Short delivery detected by CV verification'
      const nudges: { user_id: string; type: string; message: string; read: boolean }[] = []

      if (booking.resident_id) {
        nudges.push({
          user_id: booking.resident_id,
          type: 'dispute',
          message: `Your water delivery was short. ${reason}. A coordinator is reviewing this.`,
          read: false,
        })
      }

      if (booking.coordinator_id) {
        nudges.push({
          user_id: booking.coordinator_id,
          type: 'dispute',
          message: `Short delivery flagged for booking at ${booking.delivery_address || 'your ward'}. ${reason}. Please review.`,
          read: false,
        })
      }

      if (nudges.length > 0) {
        await supabase.from('nudge_log').insert(nudges)
      }
    }

    return NextResponse.json(booking)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
