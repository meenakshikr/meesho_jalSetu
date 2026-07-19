import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const supabase = createSupabaseServiceRole()
    const payload = JSON.parse(body)

    if (payload.event === 'payment.captured') {
      const paymentId = payload.payload.payment.entity.id
      const orderId = payload.payload.payment.entity.order_id

      const { error } = await supabase
        .from('payments')
        .update({
          status: 'success',
          razorpay_payment_id: paymentId,
        })
        .eq('razorpay_order_id', orderId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const { data: payment } = await supabase
        .from('payments')
        .select('booking_id, user_id')
        .eq('razorpay_order_id', orderId)
        .single()

      if (payment) {
        await supabase
          .from('booking_participants')
          .update({ payment_status: 'paid', payment_method: 'upi', payment_ref: paymentId })
          .eq('booking_id', payment.booking_id)
          .eq('user_id', payment.user_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
