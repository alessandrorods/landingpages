import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createUserRepository } from '@/domains/users/user.repository'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'dispatchOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const users = await createUserRepository().findAll()
    const couriers = users
      .filter((u) => u.role === 'motoboy')
      .map((u) => ({ id: u.id, displayName: u.displayName }))
    return NextResponse.json({ couriers })
  } catch (err) {
    console.error('[couriers] GET erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
