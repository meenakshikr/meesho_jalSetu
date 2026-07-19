import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ROLE_HOME: Record<string, string> = {
  resident: '/resident',
  coordinator: '/coordinator',
  driver: '/driver',
  owner: '/owner',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
  }

  const pathname = request.nextUrl.pathname

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isApiRoute = pathname.startsWith('/api')
  const isPublic = pathname === '/'

  if (isApiRoute) {
    return response
  }

  if (isPublic) {
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (profile) {
        return NextResponse.redirect(new URL(ROLE_HOME[profile.role] || '/resident', request.url))
      }
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profile) {
      return NextResponse.redirect(new URL(ROLE_HOME[profile.role] || '/resident', request.url))
    }
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (profile) {
      const rolePrefix = `/${profile.role}`
      if (!pathname.startsWith(rolePrefix) && !isAuthPage && !isPublic) {
        return NextResponse.redirect(new URL(ROLE_HOME[profile.role], request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
