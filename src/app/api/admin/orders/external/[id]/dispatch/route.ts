import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createExternalDispatchOrderRepository } from '@/domains/orders/external-order.repository'
import { createExternalDispatchOrderService } from '@/domains/orders/external-order.service'
import { createUserRepository } from '@/domains/users/user.repository'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!can(getRequestRole(request), 'dispatchOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: { courierId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  if (!body.courierId?.trim()) {
    return NextResponse.json({ error: 'Motoboy obrigatório' }, { status: 400 })
  }

  const users = await createUserRepository().findAll()
  const courier = users.find((u) => u.id === body.courierId)
  if (!courier) {
    return NextResponse.json({ error: 'Motoboy não encontrado' }, { status: 422 })
  }

  try {
    const service = createExternalDispatchOrderService(createExternalDispatchOrderRepository())
    await service.dispatch(id, courier.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(`[external-dispatch] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
