import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'
import { createRazorpayOrder } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { booking_id, amount, method } = body

    if (method === 'points') {
      if (profile.subsidy_points < amount) {
        return NextResponse.json({ error: 'Insufficient subsidy points' }, { status: 400 })
      }

      await supabase
        .from('users')
        .update({ subsidy_points: profile.subsidy_points - Math.ceil(amount) })
        .eq('id', profile.id)

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          booking_id,
          user_id: profile.id,
          amount,
          method: 'points',
          status: 'success',
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      await supabase
        .from('booking_participants')
        .update({ payment_status: 'points_used', payment_method: 'points' })
        .eq('booking_id', booking_id)
        .eq('user_id', profile.id)

      return NextResponse.json(payment)
    }

    if (method === 'cash') {
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          booking_id,
          user_id: profile.id,
          amount,
          method: 'cash',
          status: 'pending',
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(payment)
    }

    if (method === 'upi') {
      const order = await createRazorpayOrder(amount, booking_id)

      if (!order.id) {
        return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 })
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          booking_id,
          user_id: profile.id,
          amount,
          method: 'upi',
          status: 'pending',
          razorpay_order_id: order.id,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ payment, order })
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
