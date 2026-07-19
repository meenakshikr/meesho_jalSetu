import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceRole()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const ownerId = searchParams.get('owner_id')

    let query = supabase.from('users').select('*')

    if (role) {
      query = query.eq('role', role)
    }

    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    const { data: users, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
