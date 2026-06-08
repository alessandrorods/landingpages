import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestDisplayName } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { OrderServiceError } from '@/domains/orders/order.service'
import { signTrackingToken } from '@/domains/orders/tracking-token'
import type { UpdateOrderInput } from '@/domains/orders/order.types'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  try {
    const { orderService } = createOrderDomain()
    const order = await orderService.getById(id)
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    const trackingToken = await signTrackingToken(order.id)
    return NextResponse.json({ order: { ...order, trackingToken } })
  } catch (err) {
    console.error(`[order] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = getRequestRole(request)
  if (!can(role, 'editOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: rawId } = await params
  const id = parseInt(rawId, 10)
  if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

  let body: UpdateOrderInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  if (!body.buyerName?.trim() || !body.recipientName?.trim() || !body.deliveryDate) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'O pedido deve ter ao menos um produto' }, { status: 400 })
  }

  const actor = { type: 'user' as const, name: getRequestDisplayName(request) ?? role ?? 'admin', role: role ?? 'admin' }

  try {
    const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
    await orderService.updateOrder(id, body, actor)
    after(() => syncService.processPendingFor(id).catch((err) =>
      console.error('[edit] sync after-update falhou', { orderId: id, err }),
    ))
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof OrderServiceError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    console.error(`[edit] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
