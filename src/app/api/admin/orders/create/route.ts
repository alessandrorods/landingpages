import { after } from 'next/server'
import { NextRequest, NextResponse } from 'next/server'
import { createMercadoPagoClient } from '@/clients/mercadopago/client'
import { getRequestRole, getRequestDisplayName } from '@/domains/admin/auth'
import { can } from '@/domains/admin/permissions'
import { createPagamentoService, PagamentoServiceError } from '@/domains/pagamentos/pagamento.service'
import { signToken } from '@/domains/checkout/token'
import { createOrderDomain } from '@/domains/orders/order.domain'
import type { PaymentMethod } from '@/domains/orders/order.types'

export type FormaPagamento = PaymentMethod

export interface PedidoManualItem {
  sku: string
  nome: string
  preco: number
  quantidade: number
}

interface PedidoManualBody {
  pickup: boolean
  itens: PedidoManualItem[]
  frete: number
  endereco: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    dataEntrega: string
    periodoEntrega?: string
  }
  destinatario: {
    paraOutraPessoa: boolean
    nome: string
    telefone: string
    mensagemCartao?: string
  }
  comprador: { nome: string; telefone: string }
  obs?: string
  pagamento: FormaPagamento
}

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`${key} não configurado`)
  return value
}

function validate(raw: unknown): PedidoManualBody {
  const b = raw as Record<string, unknown>
  const itens = b.itens as unknown[]
  const endereco = b.endereco as Record<string, unknown>
  const destinatario = b.destinatario as Record<string, unknown>
  const comprador = b.comprador as Record<string, unknown>

  if (!Array.isArray(itens) || itens.length === 0) throw new Error('Adicione ao menos um produto')
  for (const item of itens) {
    const i = item as Record<string, unknown>
    if (!i.nome || typeof i.preco !== 'number' || i.preco <= 0) throw new Error('Item com preço inválido')
    if (typeof i.quantidade !== 'number' || i.quantidade < 1) throw new Error('Quantidade inválida')
  }
  const isPickup = Boolean(b.pickup)
  if (!isPickup && (!endereco?.logradouro || !endereco?.numero || !endereco?.bairro || !endereco?.cep)) throw new Error('Endereço incompleto')
  if (!endereco?.dataEntrega) throw new Error('Data obrigatória')
  if (!destinatario?.nome || !destinatario?.telefone) throw new Error('Destinatário incompleto')
  if (!comprador?.nome || !comprador?.telefone) throw new Error('Comprador incompleto')
  if (!['pix', 'card', 'mp_link'].includes(b.pagamento as string)) throw new Error('Forma de pagamento inválida')

  return raw as PedidoManualBody
}

export async function POST(request: NextRequest) {
  const role = getRequestRole(request)
  if (!role || !can(role, 'createOrder')) {
    return Response.json({ error: 'Não autorizado' }, { status: 403 })
  }
  const actor = { type: 'user' as const, name: getRequestDisplayName(request) ?? role, role }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return Response.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  let body: PedidoManualBody
  try {
    body = validate(raw)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 })
  }

  const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))

  const recipientName = body.destinatario.paraOutraPessoa
    ? body.destinatario.nome
    : body.comprador.nome
  const recipientPhone = body.destinatario.paraOutraPessoa
    ? body.destinatario.telefone
    : body.comprador.telefone

  let order: Awaited<ReturnType<typeof orderService.createOrder>>
  try {
    order = await orderService.createOrder({
      pickup: body.pickup,
      payment: body.pagamento,
      freight: body.pickup ? 0 : body.frete,
      notes: body.obs?.trim() || undefined,
      buyerName: body.comprador.nome,
      buyerPhone: body.comprador.telefone,
      recipientName,
      recipientPhone,
      cardMessage: body.destinatario.mensagemCartao?.trim() || undefined,
      zipCode: body.endereco.cep,
      street: body.endereco.logradouro,
      streetNumber: body.endereco.numero,
      complement: body.endereco.complemento,
      neighborhood: body.endereco.bairro,
      deliveryDate: body.endereco.dataEntrega,
      deliveryPeriod: body.endereco.periodoEntrega,
      items: body.itens.map((i) => ({ sku: i.sku || undefined, name: i.nome, price: i.preco, quantity: i.quantidade })),
      source: 'admin',
    }, actor)
  } catch (err) {
    console.error('[orders/create] erro ao criar pedido', err)
    return Response.json({ error: 'Erro interno ao criar pedido' }, { status: 500 })
  }

  after(() => syncService.processPendingFor(order.id).catch((err) =>
    console.error('[orders/create] sync after-create falhou', { orderId: order.id, err }),
  ))

  if (body.pagamento !== 'mp_link') {
    try {
      await orderService.updateStatus(order.id, 'approved', actor)
    } catch (err) {
      console.error('[orders/create] falha ao aprovar pedido', { orderId: order.id, err })
    }
    return Response.json({ id: order.id, numero: order.olistNumero ?? String(order.id), trackingToken: order.trackingToken })
  }

  try {
    const mpClient = createMercadoPagoClient(getEnv('MP_ACCESS_TOKEN'))
    const pagamentoService = createPagamentoService(mpClient)
    const baseUrl = getEnv('NEXT_PUBLIC_SITE_URL').replace(/\/$/, '')
    const valor = body.itens.reduce((sum, i) => sum + i.preco * i.quantidade, 0) + body.frete
    const primeiroItem = body.itens[0]
    const token = await signToken({
      orderId: order.id,
      pedido: order.olistNumero ?? String(order.id),
      sku: primeiroItem.sku || 'manual',
      nome: body.comprador.nome,
      valor,
    })
    const confirmacaoUrl = `${baseUrl}/payment/finish?payment_token=${token}`

    const mpItems = body.itens.map((item) => ({
      id: item.sku || 'manual',
      title: item.nome,
      quantity: item.quantidade,
      unit_price: item.preco,
      currency_id: 'BRL' as const,
    }))

    const preferencia = await pagamentoService.criarPreferencia({
      external_reference: String(order.id),
      items: [...mpItems, { id: 'frete', title: 'Taxa de entrega', quantity: 1, unit_price: body.frete, currency_id: 'BRL' }],
      payer: {
        name: body.comprador.nome,
        phone: { number: body.comprador.telefone.replace(/\D/g, '') },
      },
      back_urls: { success: confirmacaoUrl, failure: confirmacaoUrl, pending: confirmacaoUrl },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/payment/webhook`,
    })

    await orderService.setMpPreferenceId(order.id, preferencia.id)

    return Response.json({ id: order.id, numero: order.olistNumero ?? String(order.id), trackingToken: order.trackingToken, linkPagamento: preferencia.initPoint })
  } catch (err) {
    if (err instanceof PagamentoServiceError) {
      return Response.json({ error: err.message }, { status: 502 })
    }
    throw err
  }
}
