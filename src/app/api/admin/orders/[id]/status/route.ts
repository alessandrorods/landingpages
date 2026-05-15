import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { OrderServiceError } from '@/domains/orders/order.service'
import type { OrderStatus } from '@/domains/orders/order.types'

const VALID: OrderStatus[] = [
  'pending', 'approved', 'preparing', 'invoiced',
  'ready', 'dispatched', 'delivered', 'undelivered', 'cancelled',
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
  if (!can(getRequestRole(request), 'updateOrderStatus')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: { situacao?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const status = (body.situacao as OrderStatus | undefined)
  if (!status || !VALID.includes(status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
    await orderService.updateStatus(id, status)
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
