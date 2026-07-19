import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'
import { callGeminiJSON } from '@/lib/gemini'

interface AnomalyResult {
  is_anomaly: boolean
  percent_above: number
  reason: string
  severity: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id, tanker_id, ward_id, price_per_liter } = body

    if (!booking_id) {
      return NextResponse.json({ error: 'booking_id is required' }, { status: 400 })
    }

    const supabase = createSupabaseServiceRole()

    let effectiveWardId = ward_id
    let effectiveTankerId = tanker_id
    let effectivePrice = price_per_liter

    if (!effectiveWardId || !effectivePrice) {
      const { data: booking } = await supabase
        .from('bookings')
        .select('ward_id, tanker_id, price_per_liter')
        .eq('id', booking_id)
        .single()
      if (booking) {
        effectiveWardId = effectiveWardId || booking.ward_id
        effectiveTankerId = effectiveTankerId || booking.tanker_id
        effectivePrice = effectivePrice || booking.price_per_liter
      }
    }

    const { data: ward } = await supabase
      .from('wards')
      .select('district')
      .eq('id', effectiveWardId)
      .single()

    const { data: history } = await supabase
      .from('bookings')
      .select('price_per_liter, ward_id')
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(30)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const districtBookings = (history || []).filter((b: any) => b.ward_id === effectiveWardId)
    const avgPrice = districtBookings.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? districtBookings.reduce((s: number, b: any) => s + b.price_per_liter, 0) / districtBookings.length
      : effectivePrice

    const percentAbove = ((effectivePrice - avgPrice) / avgPrice) * 100

    if (percentAbove <= 20) {
      return NextResponse.json({ is_anomaly: false, percent_above: percentAbove, reason: '', severity: 'low' })
    }

    const system = `You are JalSetu's anti-price-gouging AI for water tankers in India.
Determine if a tanker is charging an exploitative price.
Context: Summer prices in India can legitimately be 20 to 30 percent higher due to increased demand.
Only flag as anomaly if price is genuinely exploitative, typically more than 40 percent above average.
Return JSON with exactly these fields:
{
  "is_anomaly": boolean,
  "percent_above": number,
  "reason": "max 12 words explaining the verdict in plain English",
  "severity": "low" or "medium" or "high"
}`

    const user = `District: ${ward?.district || 'Unknown'}
District average price per liter: ₹${avgPrice.toFixed(2)}
This booking price per liter: ₹${effectivePrice}
Percent above average: ${percentAbove.toFixed(1)}%
Number of historical data points used: ${districtBookings.length}`

    const result = await callGeminiJSON<AnomalyResult>(system, user)

    if (result.is_anomaly) {
      await supabase.from('anomaly_logs').insert({
        booking_id,
        tanker_id: effectiveTankerId,
        ward_id: effectiveWardId,
        district_avg_price: avgPrice,
        charged_price: effectivePrice,
        percent_above: percentAbove,
        ai_reason: result.reason,
      })

      await supabase
        .from('bookings')
        .update({ anomaly_flagged: true, anomaly_reason: result.reason })
        .eq('id', booking_id)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('anomaly-check error:', error)
    return NextResponse.json(
      { error: 'Anomaly check failed', detail: String(error) },
      { status: 500 }
    )
  }
}
