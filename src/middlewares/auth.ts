import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifySession } from '@/domains/admin/auth'
import { AREA_ACCESS } from '@/domains/admin/permissions'

const PUBLIC_PATHS = ['/admin/login', '/api/admin/auth', '/api/admin/logout']

export async function authMiddleware(request: NextRequest, headers: Headers): Promise<NextResponse> {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request: { headers } })
  }

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value
  if (!cookieValue) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const role = await verifySession(cookieValue)
  if (!role) {
    const res = NextResponse.redirect(new URL('/admin/login', request.url))
    res.cookies.delete(COOKIE_NAME)
    return res
  }

  for (const [area, roles] of Object.entries(AREA_ACCESS)) {
    if (pathname.startsWith(`/admin/${area}`) && !(roles as readonly string[]).includes(role)) {
      return NextResponse.redirect(new URL(`/admin/${role}`, request.url))
    }
  }

  headers.set('x-admin-role', role)
  const res = NextResponse.next({ request: { headers } })
  // Sliding window: renew the cookie on every authenticated request
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
