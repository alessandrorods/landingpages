import { NextRequest, NextResponse } from 'next/server'
import { verifySession, COOKIE_NAME } from '@/domains/admin/auth'

export async function POST(request: NextRequest) {
  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { token } = body
  if (!token) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  const role = await verifySession(token)
  if (!role) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, role })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
