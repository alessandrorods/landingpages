import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestDisplayName, getRequestUsername } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { OrderServiceError } from '@/domains/orders/order.service'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = getRequestRole(request)
  if (!can(role, 'rescheduleOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: { deliveryDate?: string; deliveryPeriod?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { deliveryDate, deliveryPeriod } = body
  if (!deliveryDate?.trim()) {
    return NextResponse.json({ error: 'Data de entrega é obrigatória' }, { status: 400 })
  }

  const username = getRequestUsername(request)
  const actorName = getRequestDisplayName(request) ?? username ?? 'desconhecido'

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
    await orderService.rescheduleOrder(
      id,
      { deliveryDate: deliveryDate.trim(), deliveryPeriod },
      { type: 'user', name: actorName, role: role! },
    )
    after(() => syncService.processPendingFor(id).catch((err) =>
      console.error('[reschedule] sync failed', { orderId: id, err }),
    ))
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error(`[reschedule] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
