import { NextResponse } from 'next/server'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { createOrderRepository } from '@/domains/orders/order.repository'
import { createLojaIntegradaWebhookService } from '@/domains/orders/loja-integrada-webhook.service'
import type { LIWebhookPayload } from '@/clients/loja-integrada/types'

export async function POST(req: Request) {
  try {
    const payload = await req.json() as LIWebhookPayload
    const authHeader = req.headers.get('authorization')

    const { orderService } = createOrderDomain()
    const orderRepository = createOrderRepository()
    const webhookService = createLojaIntegradaWebhookService(orderService, orderRepository)

    await webhookService.processWebhook(authHeader, payload)
  } catch (err) {
    console.error('[li-webhook] erro inesperado', err)
  }

  // Always 200 — never let LI retry due to our errors
  return NextResponse.json({ ok: true })
}
