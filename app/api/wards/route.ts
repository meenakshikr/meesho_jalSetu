import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServer()
    const { data: wards, error } = await supabase
      .from('wards')
      .select('id, name')
      .order('name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(wards)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
