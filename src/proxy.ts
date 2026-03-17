import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // ÚNICA ruta pública (sin autenticación)
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/update-password',
    '/api',
    '/_next',
    '/favicon.ico'
  ]

  // Perfiles públicos (cualquier ruta que sea un ID)
  const isPublicProfile = /^\/[A-Z0-9]+-[A-Z0-9]+$/.test(pathname)

  // Si es ruta pública o perfil público, permitir acceso sin autenticación
  if (publicRoutes.includes(pathname) || isPublicProfile) {
    return supabaseResponse
  }

  // Refrescar la sesión del usuario
  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay usuario, redirigir a login (excepto rutas públicas ya manejadas)
  if (!user) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Usuario autenticado - permitir todas las rutas excepto las que requieren Creator ID
  // Las rutas que requieren Creator ID se validan en las páginas mismas
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}