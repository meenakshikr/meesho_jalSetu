import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()

    const { data: tanker, error } = await supabase
      .from('tankers')
      .select('*, driver:users!tankers_driver_id_fkey(*), owner:users!tankers_owner_id_fkey(*)')
      .eq('id', params.id)
      .single()

    if (error || !tanker) {
      return NextResponse.json({ error: 'Tanker not found' }, { status: 404 })
    }

    return NextResponse.json(tanker)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { data: tanker, error } = await supabase
      .from('tankers')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(tanker)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
