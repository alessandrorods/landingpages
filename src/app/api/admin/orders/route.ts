import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestUsername } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { createUserRepository } from '@/domains/users/user.repository'
import type { OrderStatus } from '@/domains/orders/order.types'

const VALID_STATUSES: OrderStatus[] = [
  'pending', 'approved', 'preparing',
  'ready', 'available_for_pickup', 'dispatched', 'delivered', 'undelivered', 'cancelled',
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

    let courierId: string | undefined
    const courierParam = request.nextUrl.searchParams.get('courierId')
    if (courierParam === 'me') {
      const username = getRequestUsername(request)
      if (username) {
        const user = await createUserRepository().findByUsername(username)
        courierId = user?.id
      }
    }

    const orders = await orderService.listByStatus(status, courierId)
    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[orders] GET erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
