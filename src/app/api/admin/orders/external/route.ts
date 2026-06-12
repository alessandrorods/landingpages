import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createExternalDispatchOrderRepository } from '@/domains/orders/external-order.repository'
import { createExternalDispatchOrderService } from '@/domains/orders/external-order.service'
import { EXTERNAL_PLATFORMS, type ExternalPlatform } from '@/domains/orders/external-order.types'

export async function POST(request: NextRequest) {
  if (!can(getRequestRole(request), 'dispatchOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const platform = body.platform as ExternalPlatform
  const externalNumber = String(body.externalNumber ?? '').trim()
  const deliveryDate = String(body.deliveryDate ?? '').trim()
  const scheduledTime = String(body.scheduledTime ?? '').trim()
  const zipCode = typeof body.zipCode === 'string' ? body.zipCode.trim() : ''
  const neighborhood = typeof body.neighborhood === 'string' ? body.neighborhood.trim() : ''
  const deliveryPeriod = typeof body.deliveryPeriod === 'string' ? body.deliveryPeriod.trim() : ''

  if (!EXTERNAL_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: 'Plataforma inválida' }, { status: 400 })
  }
  if (!externalNumber) {
    return NextResponse.json({ error: 'Número do pedido obrigatório' }, { status: 400 })
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(deliveryDate)) {
    return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
  }
  if (!/^\d{2}:\d{2}$/.test(scheduledTime)) {
    return NextResponse.json({ error: 'Horário inválido' }, { status: 400 })
  }

  try {
    const service = createExternalDispatchOrderService(createExternalDispatchOrderRepository())
    const order = await service.create({
      platform,
      externalNumber,
      deliveryDate,
      scheduledTime,
      zipCode: zipCode || undefined,
      neighborhood: neighborhood || undefined,
      deliveryPeriod: deliveryPeriod || undefined,
    })
    return NextResponse.json({ order })
  } catch (err) {
    console.error('[orders/external] POST falhou', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
