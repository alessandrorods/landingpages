import { after } from 'next/server'
import { PRODUCTS } from '@/constants/products'
import { FRETE_VALOR } from '@/constants/pedido'
import { createMercadoPagoClient } from '@/clients/mercadopago/client'
import { createPagamentoService, PagamentoServiceError } from '@/domains/pagamentos/pagamento.service'
import { createOrderDomain } from '@/domains/orders/order.domain'
import { OrderServiceError } from '@/domains/orders/order.service'
import { signToken } from './token'
import type { PedidoBody, CheckoutResult } from './types'

export class CheckoutError extends Error {
  constructor(
    message: string,
    public readonly detalhes?: string,
    public readonly status: number = 422,
  ) {
    super(message)
    this.name = 'CheckoutError'
  }
}

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new CheckoutError(`Variável de ambiente ${key} não configurada`, undefined, 500)
  return value
}

export async function processarCheckout(body: PedidoBody): Promise<CheckoutResult> {
  const product = PRODUCTS.find((p) => p.sku === body.sku)
  if (!product) throw new CheckoutError('Produto não encontrado', undefined, 404)

  const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
  const mpClient = createMercadoPagoClient(getEnv('MP_ACCESS_TOKEN'))
  const pagamentoService = createPagamentoService(mpClient)

  let order: Awaited<ReturnType<typeof orderService.createOrder>>
  try {
    order = await orderService.createOrder({
      payment: 'mp_link',
      freight: FRETE_VALOR,
      buyerName: body.comprador.nome,
      buyerPhone: body.comprador.telefone,
      recipientName: body.destinatario.paraOutraPessoa
        ? body.destinatario.nome
        : body.comprador.nome,
      recipientPhone: body.destinatario.paraOutraPessoa
        ? body.destinatario.telefone
        : body.comprador.telefone,
      cardMessage: body.destinatario.mensagemCartao,
      zipCode: body.endereco.cep,
      street: body.endereco.logradouro,
      streetNumber: body.endereco.numero,
      complement: body.endereco.complemento,
      neighborhood: body.endereco.bairro,
      deliveryDate: body.endereco.dataEntrega,
      deliveryPeriod: body.endereco.periodoEntrega,
      items: [{ sku: product.sku, name: product.name, price: product.price, quantity: 1 }],
      source: 'checkout',
    })
  } catch (err) {
    if (err instanceof OrderServiceError) throw new CheckoutError(err.message)
    throw err
  }

  after(() => syncService.processPendingFor(order.id).catch((err) =>
    console.error('[checkout] sync after-create falhou', { orderId: order.id, err }),
  ))

  console.log('Pedido criado no DB', { id: order.id, olistNumero: order.olistNumero })

  const baseUrl = getEnv('NEXT_PUBLIC_SITE_URL').replace(/\/$/, '')
  const valor = product.price + FRETE_VALOR
  const token = await signToken({
    orderId: order.id,
    pedido: order.olistNumero ?? String(order.id),
    sku: body.sku,
    nome: body.comprador.nome,
    valor,
  })
  const confirmacaoUrl = `${baseUrl}/payment/finish?payment_token=${token}`

  let preferencia: Awaited<ReturnType<typeof pagamentoService.criarPreferencia>>
  try {
    preferencia = await pagamentoService.criarPreferencia({
      external_reference: String(order.id),
      items: [
        { id: product.sku, title: product.name, quantity: 1, unit_price: product.price, currency_id: 'BRL' },
        { id: 'frete', title: 'Taxa de entrega', quantity: 1, unit_price: FRETE_VALOR, currency_id: 'BRL' },
      ],
      payer: {
        name: body.comprador.nome,
        phone: { number: body.comprador.telefone.replace(/\D/g, '') },
      },
      back_urls: { success: confirmacaoUrl, failure: confirmacaoUrl, pending: confirmacaoUrl },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/payment/webhook`,
    })
  } catch (err) {
    if (err instanceof PagamentoServiceError) throw new CheckoutError(err.message, undefined, 502)
    throw err
  }

  await orderService.setMpPreferenceId(order.id, preferencia.id)

  console.log('Preferência MP criada', { id: preferencia.id, orderId: order.id })

  return {
    pedidoId: order.id,
    pedidoNumero: order.olistNumero ?? String(order.id),
    redirectUrl: preferencia.initPoint,
  }
}

export async function processarPagamento(orderId: number, mpPagamentoId: string): Promise<void> {
  const { orderService, syncService } = createOrderDomain(getEnv('TINY_TOKEN'))
  const mpClient = createMercadoPagoClient(getEnv('MP_ACCESS_TOKEN'))
  const pagamentoService = createPagamentoService(mpClient)

  const pagamento = await pagamentoService.buscarPagamento(mpPagamentoId)

  if (pagamento.status === 'approved') {
    await orderService.approveFromPayment(orderId)
    after(() => syncService.processPendingFor(orderId).catch((err) =>
      console.error('[checkout] sync after-approve falhou', { orderId, err }),
    ))
    console.log('Pedido aprovado via webhook', { orderId, mpPagamentoId })
    return
  }

  if (pagamento.status === 'cancelled' || pagamento.status === 'rejected') {
    try {
      await orderService.updateStatus(orderId, 'cancelled')
      after(() => syncService.processPendingFor(orderId).catch((err) =>
        console.error('[checkout] sync after-cancel falhou', { orderId, err }),
      ))
      console.log('Pedido cancelado via webhook', { orderId, mpPagamentoId, status: pagamento.status })
    } catch (err) {
      if (err instanceof OrderServiceError) {
        console.warn('Cancelamento bloqueado', { orderId, err: err.message })
        return
      }
      throw err
    }
    return
  }

  console.log('Status MP sem ação', { orderId, mpPagamentoId, status: pagamento.status })
}
