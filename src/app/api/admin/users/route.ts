import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, ROLES } from '@/domains/admin/auth'
import type { Role } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createUserRepository } from '@/domains/users/user.repository'
import { createUserService, UserServiceError } from '@/domains/users/user.service'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageUsers')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const service = createUserService(createUserRepository())
    const users = await service.listUsers()
    return NextResponse.json({ users })
  } catch (err) {
    console.error('[users] GET erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!can(getRequestRole(request), 'manageUsers')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { username?: string; displayName?: string; password?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { username, displayName, password, role } = body
  if (!username?.trim() || !displayName?.trim() || !password || !role || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const service = createUserService(createUserRepository())
    await service.createUser({ username: username.trim(), displayName: displayName.trim(), password, role: role as Role })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    if (err instanceof UserServiceError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('[users] POST erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
