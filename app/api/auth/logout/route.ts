import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = createSupabaseServer()
    await supabase.auth.signOut()

    const response = NextResponse.json({ success: true })
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
