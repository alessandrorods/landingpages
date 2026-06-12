import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderRepository } from '@/domains/orders/order.repository'
import { createExternalDispatchOrderRepository } from '@/domains/orders/external-order.repository'
import { createExternalDispatchOrderService } from '@/domains/orders/external-order.service'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'
import { toOrderDTO } from '@/domains/orders/order.service'
import type { QueueOrder } from '@/domains/orders/dispatch-queue'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const repo = createOrderRepository()
    const externalService = createExternalDispatchOrderService(createExternalDispatchOrderRepository())
    const config = createConfigService(createConfigRepository())
    const [rawReady, rawDispatched, rawUndelivered, regions, periods, externalOrders] = await Promise.all([
      repo.findReadyForDispatch(),
      repo.findByStatus('dispatched'),
      repo.findByStatus('undelivered'),
      config.get('deliveryRegions'),
      config.get('deliveryPeriods'),
      externalService.listUpcoming(),
    ])

    const orders: QueueOrder[] = [...rawReady.map((o) => toOrderDTO(o)), ...externalOrders]
    const inRoute = rawDispatched.map((o) => toOrderDTO(o))
    const undelivered = rawUndelivered.map((o) => toOrderDTO(o))
    return NextResponse.json({ orders, inRoute, undelivered, regions, periods })
  } catch (err) {
    console.error('[dispatch-queue] GET falhou', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
