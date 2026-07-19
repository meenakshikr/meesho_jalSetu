import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceRole } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, role, ward_id, owner_id } = await request.json()

    if (!email || !password || !name || !phone || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (role === 'resident' && !ward_id) {
      return NextResponse.json({ error: 'Ward is required for residents' }, { status: 400 })
    }

    if (role === 'coordinator' && !ward_id) {
      return NextResponse.json({ error: 'Ward is required for coordinators' }, { status: 400 })
    }

    const supabase = createSupabaseServiceRole()

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: userError } = await supabase.from('users').insert({
      auth_id: authUser.user.id,
      name,
      phone,
      role,
      ward_id: ward_id || null,
      owner_id: (role === 'driver' && owner_id) ? owner_id : null,
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
