import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'
import { callGeminiJSON } from '@/lib/gemini'

interface NudgeEntry {
  user_id: string
  message: string
  urgency: 'low' | 'medium' | 'high'
}

interface NudgeResult {
  nudges: NudgeEntry[]
}

export async function POST(request: NextRequest) {
  try {
    const { ward_id } = await request.json()

    if (!ward_id) {
      return NextResponse.json({ error: 'ward_id is required' }, { status: 400 })
    }

    const supabase = createSupabaseServiceRole()

    const { data: ward } = await supabase
      .from('wards')
      .select('*')
      .eq('id', ward_id)
      .single()

    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: residents } = await supabase
      .from('users')
      .select('id, name, phone, ward_id, language')
      .eq('ward_id', ward_id)
      .eq('role', 'resident')

    if (!residents || residents.length === 0) {
      return NextResponse.json({ nudges: [] })
    }

    const residentIds = residents.map((r: { id: string }) => r.id)

    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('resident_id, volume_ordered, total_amount, created_at, status')
      .in('resident_id', residentIds)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })

    const { data: heatwaveAlerts } = await supabase
      .from('heatwave_alerts')
      .select('severity, temperature')
      .eq('district', ward?.district || '')
      .eq('active', true)
      .gt('expires_at', new Date().toISOString())
      .limit(1)

    const heatwave = heatwaveAlerts?.[0] || null

    const lastBookingMap = new Map<string, { volume: number; date: string; amount: number }>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(recentBookings || []).forEach((b: any) => {
      if (!lastBookingMap.has(b.resident_id)) {
        lastBookingMap.set(b.resident_id, {
          volume: b.volume_ordered,
          date: b.created_at,
          amount: b.total_amount,
        })
      }
    })

    const inactiveResidents = residents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((r: any) => {
        const last = lastBookingMap.get(r.id)
        if (!last) return true
        return new Date(last.date) < new Date(sixDaysAgo)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((r: any) => {
        const last = lastBookingMap.get(r.id)
        const daysSince = last
          ? Math.floor((Date.now() - new Date(last.date).getTime()) / (1000 * 60 * 60 * 24))
          : null
        return {
          id: r.id,
          name: r.name,
          phone: r.phone,
          language: r.language,
          daysSinceLastBooking: daysSince,
          lastVolume: last?.volume || 0,
          lastAmount: last?.amount || 0,
          neverOrdered: !last,
        }
      })

    if (inactiveResidents.length === 0) {
      return NextResponse.json({ nudges: [] })
    }

    const system = `You are an AI engagement engine for a water tanker delivery platform (JalSetu) in India. Generate personalized nudge messages to encourage residents to re-order water.
Write messages in simple English. Be warm, practical, and non-pushy.
Return ONLY valid JSON in this exact format:
{
  "nudges": [
    {
      "user_id": "<user-id>",
      "message": "<personalized nudge message>",
      "urgency": "low" or "medium" or "high"
    }
  ]
}
Guidelines:
- For users who never ordered: Introduce the service and highlight benefits
- For users inactive 6-7 days: Gentle reminder about water needs
- During heatwaves: Increase urgency, mention water scarcity
- Keep messages under 100 words`

    const user = `Generate personalized nudge messages for these inactive residents in ${ward?.name || 'unknown ward'}.
${heatwave ? `HEATWAVE ALERT: ${heatwave.severity} severity, ${heatwave.temperature}°C — increase urgency for all nudges.` : 'No active heatwave.'}
Residents to nudge:
${JSON.stringify(inactiveResidents, null, 2)}`

    const parsed = await callGeminiJSON<NudgeResult>(system, user)

    return NextResponse.json({ nudges: parsed.nudges })
  } catch (error) {
    console.error('predictive-nudge error:', error)
    return NextResponse.json(
      { error: 'Predictive nudge failed', detail: String(error) },
      { status: 500 }
    )
  }
}
