import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()

    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*, user:users(name), booking:bookings(created_at)')
      .eq('tanker_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(reviews)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
