import { NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'
import { callGeminiJSON } from '@/lib/gemini'

interface WardDemand {
  ward_id: string
  ward_name: string
  current_demand_score: number
  predicted_demand_tomorrow: number
  pending_bookings: number
  avg_price_paid: number
  reasoning: string
}

export async function POST() {
  try {
    const supabase = createSupabaseServiceRole()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: wards } = await supabase
      .from('wards')
      .select('id, name, district, city')

    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('ward_id, status, price_per_liter, created_at')
      .gte('created_at', thirtyDaysAgo)

    const { data: activeAlerts } = await supabase
      .from('heatwave_alerts')
      .select('district, severity, temperature')
      .eq('active', true)

    const wardStats = (wards || []).map(ward => {
      const wardBookings = (recentBookings || []).filter(b => b.ward_id === ward.id)
      const pendingCount = wardBookings.filter(b =>
        ['pending', 'open', 'confirmed'].includes(b.status)
      ).length
      const deliveredCount = wardBookings.filter(b => b.status === 'delivered').length
      const avgPrice = wardBookings.length
        ? wardBookings.reduce((s, b) => s + b.price_per_liter, 0) / wardBookings.length
        : 0
      const heatwave = activeAlerts?.find(a => a.district === ward.district)

      return {
        ward_id: ward.id,
        ward_name: ward.name,
        pending_bookings: pendingCount,
        total_bookings_30d: deliveredCount,
        avg_price_paid: Number(avgPrice.toFixed(2)),
        heatwave_active: !!heatwave,
        heatwave_severity: heatwave?.severity ?? null,
        temperature: heatwave?.temperature ?? null,
      }
    })

    const system = `You are JalSetu's demand forecasting AI for water tanker operators in India.
Analyze booking patterns and heatwave data to predict water demand by ward.
Higher pending bookings, active heatwaves, and higher temperatures all increase demand score.
Return a JSON array with ALL wards from input, each object must have exactly these fields:
{
  "ward_id": string copied exactly from input,
  "ward_name": string copied exactly from input,
  "current_demand_score": number 0 to 100,
  "predicted_demand_tomorrow": number 0 to 100,
  "pending_bookings": number copied from input,
  "avg_price_paid": number copied from input,
  "reasoning": "max 8 words explaining demand level"
}`

    const user = `Ward booking data for last 30 days:
${JSON.stringify(wardStats)}`

    const forecast = await callGeminiJSON<WardDemand[]>(system, user)
    const sorted = forecast.sort((a, b) => b.predicted_demand_tomorrow - a.predicted_demand_tomorrow)

    return NextResponse.json({ forecast: sorted })
  } catch (error) {
    console.error('demand-forecast error:', error)
    return NextResponse.json(
      { error: 'Demand forecast failed', detail: String(error) },
      { status: 500 }
    )
  }
}
