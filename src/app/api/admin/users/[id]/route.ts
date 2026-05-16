import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, ROLES } from '@/domains/admin/auth'
import type { Role } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createUserRepository } from '@/domains/users/user.repository'
import { createUserService, UserServiceError } from '@/domains/users/user.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!can(getRequestRole(request), 'manageUsers')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params

  let body: { username?: string; displayName?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { username, displayName, role } = body
  if (!username?.trim() || !displayName?.trim() || !role || !ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  try {
    const service = createUserService(createUserRepository())
    await service.updateUser(id, { username: username.trim(), displayName: displayName.trim(), role: role as Role })
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof UserServiceError) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('[users] PATCH erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!can(getRequestRole(request), 'manageUsers')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params

  try {
    const service = createUserService(createUserRepository())
    await service.deleteUser(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof UserServiceError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[users] DELETE erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
