import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

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
    const { booking_id, tanker_id, rating, comment } = body

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        user_id: profile.id,
        tanker_id,
        rating,
        comment,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: tankerReviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('tanker_id', tanker_id)

    if (tankerReviews && tankerReviews.length > 0) {
      const avgRating = tankerReviews.reduce((sum, r) => sum + r.rating, 0) / tankerReviews.length
      await supabase
        .from('tankers')
        .update({ rating: Math.round(avgRating * 10) / 10 })
        .eq('id', tanker_id)
    }

    return NextResponse.json(review, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
