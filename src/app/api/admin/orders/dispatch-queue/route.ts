import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createOrderRepository } from '@/domains/orders/order.repository'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'
import { toOrderDTO } from '@/domains/orders/order.service'

export async function GET(request: NextRequest) {
  if (!can(getRequestRole(request), 'viewOrders')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  try {
    const repo = createOrderRepository()
    const config = createConfigService(createConfigRepository())
    const [rawReady, rawDispatched, regions, periods] = await Promise.all([
      repo.findReadyForDispatch(),
      repo.findByStatus('dispatched'),
      config.get('deliveryRegions'),
      config.get('deliveryPeriods'),
    ])

    const orders = rawReady.map((o) => toOrderDTO(o))
    const inRoute = rawDispatched.map((o) => toOrderDTO(o))
    return NextResponse.json({ orders, inRoute, regions, periods })
  } catch (err) {
    console.error('[dispatch-queue] GET falhou', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
