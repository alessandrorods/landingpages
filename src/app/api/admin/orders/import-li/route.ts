import { NextRequest, NextResponse } from 'next/server'
import { getRequestRole } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createLIClient } from '@/clients/loja-integrada/client'
import { parseClienteObs } from '@/clients/loja-integrada/obs-parser'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { createOrderRepository } from '@/domains/orders/order.repository'
import { createConfigRepository } from '@/domains/config/config.repository'
import { createConfigService } from '@/domains/config/config.service'
import type { Actor } from '@/domains/orders/order.types'
import type { LIWebhookPayload } from '@/clients/loja-integrada/types'

function getEnvOrThrow(key: string): string {
  const v = process.env[key]
  if (!v) throw new Error(`${key} não configurado`)
  return v
}

function firstPhone(c: LIWebhookPayload['cliente']): string {
  return c.telefone_celular ?? c.telefone_comercial ?? c.telefone_principal ?? ''
}

function fallbackDeliveryDate(isoDate: string): string {
  const d = new Date(new Date(isoDate).getTime() - 3 * 60 * 60 * 1000)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

export async function POST(request: NextRequest) {
  const role = getRequestRole(request)
  if (!can(role, 'createOrder')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  let body: { liNumero?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 })
  }

  const { liNumero } = body
  if (!liNumero || typeof liNumero !== 'number') {
    return NextResponse.json({ error: 'liNumero é obrigatório' }, { status: 400 })
  }

  try {
    const liClient = createLIClient(getEnvOrThrow('LI_CHAVE_API'), getEnvOrThrow('LI_CHAVE_APLICACAO'))
    const orderRepository = createOrderRepository()

    const liOrder = await liClient.getOrder(liNumero)
    if (!liOrder) {
      return NextResponse.json({ error: `Pedido #${liNumero} não encontrado na Loja Integrada` }, { status: 404 })
    }

    if (liOrder.situacao.cancelado) {
      return NextResponse.json({ error: 'Este pedido está cancelado na Loja Integrada' }, { status: 422 })
    }

    if (!liOrder.situacao.aprovado) {
      return NextResponse.json({ error: 'Este pedido ainda não foi aprovado na Loja Integrada' }, { status: 422 })
    }

    // Idempotency check
    const existing = await orderRepository.findByOlistId(liOrder.id)
    if (existing) {
      return NextResponse.json({ error: `Este pedido já foi importado (pedido #${existing.id})` }, { status: 409 })
    }

    const obs = parseClienteObs(liOrder.cliente_obs)
    const addr = liOrder.endereco_entrega
    const phone = firstPhone(liOrder.cliente)
    const envioMapping = await createConfigService(createConfigRepository()).get('liEnvioMapping')
    const envioId = liOrder.envios?.[0]?.forma_envio?.id
    const deliveryPeriod = envioId ? (envioMapping[String(envioId)] || undefined) : undefined

    const { orderService } = createOrderDomain()
    const actor: Actor = { type: 'system', name: 'Importação manual LI' }

    const created = await orderService.createOrder({
      source: 'loja_integrada',
      pickup: false,
      payment: 'card',
      freight: parseFloat(String(liOrder.valor_envio)),
      buyerName: liOrder.cliente.nome,
      buyerPhone: phone,
      recipientName: obs.recipientName ?? liOrder.cliente.nome,
      recipientPhone: phone,
      cardMessage: obs.cardMessage ?? undefined,
      notes: obs.notes ?? undefined,
      deliveryDate: obs.deliveryDate ?? fallbackDeliveryDate(liOrder.data_criacao),
      deliveryPeriod,
      zipCode: addr.cep,
      street: addr.endereco,
      streetNumber: addr.numero,
      complement: addr.complemento ?? undefined,
      neighborhood: addr.bairro,
      items: liOrder.itens.map((i) => ({
        sku: i.sku || undefined,
        name: i.nome,
        price: parseFloat(String(i.preco_venda)),
        quantity: Math.round(parseFloat(String(i.quantidade))),
      })),
      initialStatus: 'approved',
    }, actor)

    await orderRepository.updateOlistRef(created.id, liOrder.id, String(liOrder.numero))

    return NextResponse.json({ ok: true, orderId: created.id })
  } catch (err) {
    console.error('[import-li] erro', err)
    const message = err instanceof Error ? err.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
