import { NextRequest, NextResponse } from 'next/server'
import { callGeminiJSON } from '@/lib/gemini'

interface HeatwaveAdvisory {
  severity: 'watch' | 'warning' | 'emergency'
  advisory_english: string
  do_list: string[]
  dont_list: string[]
  best_time_outdoors: string
}

export async function POST(request: NextRequest) {
  try {
    const { temperature, feels_like, humidity, district, state } = await request.json()

    if (!district) {
      return NextResponse.json({ error: 'district is required' }, { status: 400 })
    }

    const system = `You are JalSetu's heatwave safety AI for India.
Generate clear actionable heatwave advice for daily wage workers, farmers, and elderly people.
Use simple plain English at a Class 5 reading level.
Return JSON with exactly these fields:
{
  "severity": "watch" for 35 to 39 degrees, "warning" for 40 to 44 degrees, "emergency" for 45 degrees and above,
  "advisory_english": "exactly 2 sentences summarizing the situation and main advice",
  "do_list": ["exactly 3 specific actions people should take right now"],
  "dont_list": ["exactly 2 things people must avoid"],
  "best_time_outdoors": "specific time window e.g. Before 9am and after 6pm only"
}`

    const user = `Location: ${district}${state ? ', ' + state : ''}
Current temperature: ${temperature || 'unknown'}°C
Feels like: ${feels_like || 'unknown'}°C
Humidity: ${humidity || 'unknown'}%`

    const advisory = await callGeminiJSON<HeatwaveAdvisory>(system, user)
    return NextResponse.json(advisory)
  } catch (error) {
    console.error('heatwave-advisory error:', error)
    return NextResponse.json(
      { error: 'Heatwave advisory failed', detail: String(error) },
      { status: 500 }
    )
  }
}
