import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()

    const { data: receipt, error } = await supabase
      .from('receipts')
      .select('*, tanker:tankers(*), booking:bookings(*)')
      .eq('id', params.id)
      .single()

    if (error || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 })
    }

    return NextResponse.json(receipt)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
