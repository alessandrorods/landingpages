import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestDisplayName } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { createUserRepository } from '@/domains/users/user.repository'
import { OrderServiceError } from '@/domains/orders/order.service'
import type { OrderStatus } from '@/domains/orders/order.types'

const VALID: OrderStatus[] = [
  'pending', 'approved', 'preparing',
  'ready', 'available_for_pickup', 'dispatched', 'delivered', 'undelivered', 'cancelled',
]

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = getRequestRole(request)
  if (!role) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: { situacao?: string; force?: boolean; courierId?: string; receivedBy?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const status = (body.situacao as OrderStatus | undefined)
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }

  const canForce = role === 'admin' || role === 'expedicao'
  const force = body.force === true && canForce

  if (!force && !can(role, 'updateOrderStatus')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const actor = { type: 'user' as const, name: getRequestDisplayName(request) ?? role, role }

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))

    if (force && status === 'dispatched' && body.courierId) {
      const courier = await createUserRepository().findById(body.courierId)
      if (!courier) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 422 })
      await orderService.dispatch(id, courier.id, courier.displayName, actor)
    } else if (force && status === 'delivered') {
      const userRepo = createUserRepository()
      const courier = body.courierId ? await userRepo.findById(body.courierId) : null
      await orderService.deliver(
        id,
        body.receivedBy?.trim() || '',
        courier?.id ?? '',
        courier?.displayName ?? '',
        actor,
      )
    } else {
      await orderService.updateStatus(id, status, actor, force ? { force: true } : undefined)
    }

    after(() => syncService.processPendingFor(id).catch((err) =>
      console.error('[status] sync after-update falhou', { orderId: id, err }),
    ))
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error(`[status] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
