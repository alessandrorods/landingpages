import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { signTrackingToken } from '@/domains/orders/tracking-token'

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
    const { orderService } = createOrderDomain(getEnv('TINY_TOKEN'))
    const order = await orderService.getById(id)
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    const trackingToken = await signTrackingToken(order.id)
    return NextResponse.json({ order: { ...order, trackingToken } })
  } catch (err) {
    console.error(`[order] id=${id} erro`, err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
