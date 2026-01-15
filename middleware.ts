import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'
import './lib/auth-types'

// Use Node.js runtime instead of Edge runtime to support Prisma and email services
export const runtime = 'nodejs'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/sign-up', '/verify-request', '/login/admin' , '/not-user']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  // Check authentication for protected routes
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  // Redirect to login if not authenticated
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Role-based route protection
  if (session?.user) {
    const userRole = (session.user as any).role as string
    
    // Admin routes
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Teacher routes
    if (pathname.startsWith('/teacher') && userRole !== 'TEACHER') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Student routes
    if (pathname.startsWith('/students') && userRole !== 'STUDENT') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - verification (verification page)
     * - login (login pages)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|verification|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
