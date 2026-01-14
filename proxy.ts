import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  // Check if user is authenticated for protected routes
  const token = request.cookies.get('auth-token')?.value
  const isAuthPage = request.nextUrl.pathname === '/'
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // If already authenticated and trying to access login, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

