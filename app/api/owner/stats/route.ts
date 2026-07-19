import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
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

    if (!profile || profile.role !== 'owner') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { data: tankers } = await supabase
      .from('tankers')
      .select('id')
      .eq('owner_id', profile.id)

    if (!tankers || tankers.length === 0) {
      return NextResponse.json({
        total_revenue_today: 0,
        total_deliveries_today: 0,
        avg_rating: 0,
        anomalies: [],
      })
    }

    const tankerIds = tankers.map((t) => t.id)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: todayBookings } = await supabase
      .from('bookings')
      .select('total_amount, status')
      .in('tanker_id', tankerIds)
      .gte('delivered_at', todayStart.toISOString())

    const todayRevenue = todayBookings
      ?.filter((b) => b.status === 'delivered')
      .reduce((sum, b) => sum + b.total_amount, 0) || 0

    const totalDeliveriesToday = todayBookings
      ?.filter((b) => b.status === 'delivered').length || 0

    const { data: allBookings } = await supabase
      .from('bookings')
      .select('total_amount, status')
      .in('tanker_id', tankerIds)

    const totalRevenue = allBookings
      ?.filter((b) => b.status === 'delivered')
      .reduce((sum, b) => sum + b.total_amount, 0) || 0

    const totalDeliveries = allBookings
      ?.filter((b) => b.status === 'delivered').length || 0

    const { data: allTankers } = await supabase
      .from('tankers')
      .select('rating')
      .eq('owner_id', profile.id)

    const avgRating = allTankers && allTankers.length > 0
      ? allTankers.reduce((sum, t) => sum + t.rating, 0) / allTankers.length
      : 0

    const { data: anomalies } = await supabase
      .from('anomaly_logs')
      .select('*')
      .in('tanker_id', tankerIds)
      .eq('resolved', false)

    return NextResponse.json({
      todayRevenue,
      totalDeliveriesToday,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRevenue,
      totalDeliveries,
      anomalies: anomalies || [],
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
