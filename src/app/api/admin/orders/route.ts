import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import type { OrderStatus } from '@/domains/orders/order.types'

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'approved', 'preparing', 'invoiced',
  'ready', 'dispatched', 'delivered', 'undelivered', 'cancelled',
]

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const status = request.nextUrl.searchParams.get('status') as OrderStatus | null
    ?? request.nextUrl.searchParams.get('situacao') as OrderStatus | null

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }

  try {
    const { orderService } = createOrderDomain(getEnv('TINY_TOKEN'))
    const orders = await orderService.listByStatus(status)
    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[orders] GET erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
