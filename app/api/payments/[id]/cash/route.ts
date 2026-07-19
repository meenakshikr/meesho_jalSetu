import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

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

    const { error } = await supabase
      .from('payments')
      .update({ status: 'success' })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (payment) {
      await supabase
        .from('booking_participants')
        .update({ payment_status: 'paid', payment_method: 'cash' })
        .eq('booking_id', payment.booking_id)
        .eq('user_id', payment.user_id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
