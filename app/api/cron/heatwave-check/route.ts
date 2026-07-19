import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

const HEATWAVE_THRESHOLD = 40

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServiceRole()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const { data: wards } = await supabase
    .from('wards')
    .select('district, state, lat, lng')

  if (!wards?.length) return NextResponse.json({ checked: 0 })

  const districts = Array.from(new Map(wards.map(w => [w.district, w])).values())
  let created = 0

  for (const d of districts) {
    try {
      if (!d.lat || !d.lng) continue

      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${d.lat}&lon=${d.lng}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
      )
      const weather = await weatherRes.json()
      const temp = weather.main?.temp
      const feelsLike = weather.main?.feels_like
      const humidity = weather.main?.humidity

      if (!temp || temp < HEATWAVE_THRESHOLD) continue

      const advRes = await fetch(`${appUrl}/api/ai/heatwave-advisory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: temp,
          feels_like: feelsLike,
          humidity,
          district: d.district,
          state: d.state,
        }),
      })
      const advisory = await advRes.json()

      await supabase
        .from('heatwave_alerts')
        .update({ active: false })
        .eq('district', d.district)

      await supabase.from('heatwave_alerts').insert({
        district: d.district,
        state: d.state,
        temperature: temp,
        feels_like: feelsLike,
        severity: advisory.severity || 'watch',
        ai_advisory: advisory.advisory_english || advisory.advisory || 'Stay hydrated.',
        active: true,
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      })

      created++
    } catch (err) {
      console.error(`Failed for district ${d.district}:`, err)
      continue
    }
  }

  return NextResponse.json({ districts_checked: districts.length, alerts_created: created })
}
