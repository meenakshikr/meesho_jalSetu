import { NextResponse } from 'next/server'
import { createSupabaseServer, createSupabaseServiceRole } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const serviceClient = createSupabaseServiceRole()
    const { data: profile, error: profileError } = await serviceClient
      .from('users')
      .select('*, ward:wards(*)')
      .eq('auth_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
