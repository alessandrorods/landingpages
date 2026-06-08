import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole, getRequestUsername } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { createUserRepository } from '@/domains/users/user.repository'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const username = getRequestUsername(request)
  if (!username) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const courier = await createUserRepository().findByUsername(username)
  if (!courier) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  try {
    const { orderService } = createOrderDomain()
    const orders = await orderService.listDeliveredTodayByCourier(courier.id)
    return NextResponse.json({ orders })
  } catch (err) {
    console.error('[motoboy] delivered-today erro', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
