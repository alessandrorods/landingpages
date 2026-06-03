import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createUserRepository } from '@/domains/users/user.repository'
import { createUserService } from '@/domains/users/user.service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!can(getRequestRole(request), 'manageUsers')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id } = await params

  let body: { password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { password } = body
  if (!password || password.length < 4) {
    return NextResponse.json({ error: 'Senha deve ter ao menos 4 caracteres' }, { status: 400 })
  }

  try {
    const service = createUserService(createUserRepository())
    await service.changePassword(id, password)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[users] PATCH password erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
