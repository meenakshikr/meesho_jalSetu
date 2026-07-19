import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const authResponse = NextResponse.json({ success: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set(name: string, value: string, options: Record<string, unknown>) {
            authResponse.cookies.set(name, value, options as Parameters<typeof authResponse.cookies.set>[2])
          },
          remove(name: string, options: Record<string, unknown>) {
            authResponse.cookies.set(name, '', options as Parameters<typeof authResponse.cookies.set>[2])
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', user!.id)
      .single()

    const response = NextResponse.json({ user, profile })
    authResponse.cookies.getAll().forEach(c => {
      response.cookies.set(c.name, c.value)
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
