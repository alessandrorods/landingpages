import { NextRequest, NextResponse } from 'next/server'
import { createSession, ROLES, COOKIE_NAME } from '@/lib/admin/auth'
import type { Role } from '@/lib/admin/auth'

const PASSWORD_KEYS: Record<Role, string> = {
  vendas: 'VENDAS_PASSWORD',
  florista: 'FLORISTA_PASSWORD',
  expedicao: 'EXPEDICAO_PASSWORD',
  admin: 'ADMIN_PASSWORD',
}

export async function POST(request: NextRequest) {
  let body: { role?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { role, password } = body

  if (!role || !password || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'Área ou senha inválida' }, { status: 400 })
  }

  const expectedPassword = process.env[PASSWORD_KEYS[role as Role]]
  if (!expectedPassword || password !== expectedPassword) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const session = await createSession(role as Role)

  const res = NextResponse.json({ ok: true, role })
  res.cookies.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12,
    path: '/',
  })
  return res
}
