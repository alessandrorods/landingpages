import { NextRequest, NextResponse } from 'next/server'
import { createSession, COOKIE_NAME } from '@/domains/admin/auth'
import { createUserRepository } from '@/domains/users/user.repository'
import { createUserService } from '@/domains/users/user.service'

export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { username, password } = body
  if (!username || !password) {
    return NextResponse.json({ error: 'Usuário ou senha inválidos' }, { status: 400 })
  }

  const userService = createUserService(createUserRepository())
  const result = await userService.verifyCredentials(username, password)
  if (!result) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos' }, { status: 401 })
  }

  const session = await createSession(result.role)
  const res = NextResponse.json({ ok: true, role: result.role, token: session })
  res.cookies.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return res
}
