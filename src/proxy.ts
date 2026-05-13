import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, verifySession } from '@/domains/admin/auth'
import type { Role } from '@/domains/admin/auth'

const AREA_ROUTES: Record<string, Role> = {
  '/admin/vendas': 'vendas',
  '/admin/florista': 'florista',
  '/admin/expedicao': 'expedicao',
  '/admin/motoboy': 'motoboy',
  '/admin/painel': 'admin',
}

const PUBLIC_PATHS = ['/admin/login', '/api/admin/auth', '/api/admin/logout']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const baseHeaders = new Headers(request.headers)
  baseHeaders.set('x-skip-analytics', '1')

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request: { headers: baseHeaders } })
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

  for (const [prefix, area] of Object.entries(AREA_ROUTES)) {
    if (pathname.startsWith(prefix) && !['admin', area].includes(role)) {
      return NextResponse.redirect(new URL(`/admin/${role}`, request.url))
    }
  }

  const headers = baseHeaders
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

export const config = {
  matcher: ['/admin(.*)', '/api/admin(.*)', '/print(.*)'],
}
