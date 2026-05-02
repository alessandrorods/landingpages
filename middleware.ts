import { NextRequest, NextResponse } from 'next/server'
import { COOKIE_NAME, ROLES } from '@/lib/admin/auth'
import type { Role } from '@/lib/admin/auth'

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret || 'dev-secret'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function getRole(cookieValue: string): Promise<Role | null> {
  const dot = cookieValue.lastIndexOf('.')
  if (dot === -1) return null
  const role = cookieValue.slice(0, dot) as Role
  const sig = cookieValue.slice(dot + 1)
  if (!ROLES.includes(role)) return null
  const expected = await sign(role, process.env.ADMIN_SECRET ?? '')
  if (sig !== expected) return null
  return role
}

const AREA_ROUTES: Record<string, Role> = {
  '/admin/vendas': 'vendas',
  '/admin/florista': 'florista',
  '/admin/expedicao': 'expedicao',
  '/admin/motoboy': 'motoboy',
}

const PUBLIC_PATHS = ['/admin/login', '/api/admin/auth', '/api/admin/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  const cookieValue = request.cookies.get(COOKIE_NAME)?.value
  if (!cookieValue) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const role = await getRole(cookieValue)
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

  const headers = new Headers(request.headers)
  headers.set('x-duque-role', role)
  return NextResponse.next({ request: { headers } })
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
