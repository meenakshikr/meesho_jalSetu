import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'
import { estimateDaysRemaining } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServiceRole()

  const { data: residents } = await supabase
    .from('users')
    .select('id, ward_id, wards!users_ward_id_fkey(district)')
    .eq('role', 'resident')

  if (!residents?.length) return NextResponse.json({ nudges: 0 })

  let nudgesSent = 0

  for (const resident of residents) {
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('volume_ordered, created_at')
        .eq('resident_id', resident.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(3)

      if (!bookings?.length) continue

      const lastBooking = bookings[0]
      const daysRemaining = estimateDaysRemaining(
        lastBooking.created_at,
        lastBooking.volume_ordered,
        4
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const district = (resident as any).wards?.district
      const { data: heatwave } = await supabase
        .from('heatwave_alerts')
        .select('id')
        .eq('district', district)
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      const heatwaveActive = !!heatwave
      const threshold = heatwaveActive ? 4 : 2

      if (daysRemaining > threshold) continue

      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase
        .from('nudge_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', resident.id)
        .eq('type', 'predictive')
        .gte('created_at', today)

      if (count && count > 0) continue

      const message = heatwaveActive
        ? `Heatwave in your area. You may run out of water in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Book before tankers fill up.`
        : `Based on your usage, you may run out of water in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Consider booking soon.`

      await supabase.from('nudge_log').insert({
        user_id: resident.id,
        type: 'predictive',
        message,
        read: false,
      })

      nudgesSent++
    } catch (err) {
      console.error(`Nudge failed for resident ${resident.id}:`, err)
      continue
    }
  }

  return NextResponse.json({ residents_checked: residents.length, nudges_sent: nudgesSent })
}
