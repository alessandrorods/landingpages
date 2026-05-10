import { PRODUCTS } from '@/constants/products'
import { FRETE_VALOR } from '@/constants/pedido'
import { createOlistClient } from '@/lib/olist/client'
import { createPedidoService, PedidoServiceError } from '@/lib/olist/pedido.service'
import type { SituacaoPedido } from '@/lib/olist/types'
import { createMercadoPagoClient } from '@/lib/mercadopago/client'
import { createPagamentoService, PagamentoServiceError } from '@/lib/mercadopago/pagamento.service'
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
  const product = PRODUCTS.find(p => p.sku === body.sku)
  if (!product) throw new CheckoutError('Produto não encontrado', undefined, 404)

  const olistClient = createOlistClient(getEnv('TINY_TOKEN'))
  const pedidoService = createPedidoService(olistClient)
  const mpClient = createMercadoPagoClient(getEnv('MP_ACCESS_TOKEN'))
  const pagamentoService = createPagamentoService(mpClient)

  let pedido: Awaited<ReturnType<typeof pedidoService.criarPedido>>
  try {
    pedido = await pedidoService.criarPedido(body)
  } catch (err) {
    if (err instanceof PedidoServiceError) throw new CheckoutError(err.message, err.detalhes)
    throw err
  }

  console.log('Pedido criado no Olist', { id: pedido.id, numero: pedido.numero })

  const baseUrl = getEnv('NEXT_PUBLIC_SITE_URL').replace(/\/$/, '')
  const valor = product.price + FRETE_VALOR
  const token = signToken({ pedidoId: pedido.id, pedido: pedido.numero, sku: body.sku, nome: body.comprador.nome, valor })
  const confirmacaoUrl = `${baseUrl}/payment/finish?payment_token=${token}`

  let preferencia: Awaited<ReturnType<typeof pagamentoService.criarPreferencia>>
  try {
    preferencia = await pagamentoService.criarPreferencia({
      external_reference: String(pedido.id),
      items: [
        {
          id: product.sku,
          title: product.name,
          quantity: 1,
          unit_price: product.price,
          currency_id: 'BRL',
        },
        {
          id: 'frete',
          title: 'Taxa de entrega',
          quantity: 1,
          unit_price: FRETE_VALOR,
          currency_id: 'BRL',
        },
      ],
      payer: {
        name: body.comprador.nome,
        phone: { number: body.comprador.telefone.replace(/\D/g, '') },
      },
      back_urls: {
        success: confirmacaoUrl,
        failure: confirmacaoUrl,
        pending: confirmacaoUrl,
      },
      auto_return: 'approved',
      notification_url: `${baseUrl}/api/payment/webhook`,
    })
  } catch (err) {
    if (err instanceof PagamentoServiceError) throw new CheckoutError(err.message, undefined, 502)
    throw err
  }

  console.log('Preferência MP criada', { id: preferencia.id, pedidoId: pedido.id })

  return { pedidoId: pedido.id, pedidoNumero: pedido.numero, redirectUrl: preferencia.initPoint }
}

const MP_SITUACAO: Partial<Record<string, SituacaoPedido>> = {
  approved:  'aprovado',
  cancelled: 'cancelado',
  rejected:  'cancelado',
}

// Ordered progression: a situacao só pode avançar, nunca regredir.
// 'cancelado' e 'nao_entregue' são terminais fora da progressão linear.
const ORDEM_SITUACAO: SituacaoPedido[] = [
  'aberto',
  'aprovado',
  'preparando_envio',
  'faturado',
  'pronto_envio',
  'enviado',
  'entregue',
]

function transicaoPermitida(atual: string | undefined, destino: SituacaoPedido): boolean {
  if (destino === 'cancelado') {
    // Só cancela se o pedido ainda não avançou além de 'aprovado'
    const idxAtual = ORDEM_SITUACAO.indexOf((atual ?? '') as SituacaoPedido)
    const idxAprovado = ORDEM_SITUACAO.indexOf('aprovado')
    return idxAtual <= idxAprovado
  }
  const idxAtual = ORDEM_SITUACAO.indexOf((atual ?? '') as SituacaoPedido)
  const idxDestino = ORDEM_SITUACAO.indexOf(destino)
  // Permite apenas avançar; estados desconhecidos (idxAtual === -1) também bloqueiam
  return idxAtual !== -1 && idxDestino > idxAtual
}

export async function processarPagamento(pedidoId: number, mpPagamentoId: string): Promise<void> {
  const olistClient = createOlistClient(getEnv('TINY_TOKEN'))
  const pedidoService = createPedidoService(olistClient)
  const mpClient = createMercadoPagoClient(getEnv('MP_ACCESS_TOKEN'))
  const pagamentoService = createPagamentoService(mpClient)

  const pagamento = await pagamentoService.buscarPagamento(mpPagamentoId)
  const situacaoDestino = MP_SITUACAO[pagamento.status]

  if (!situacaoDestino) {
    console.log('Status sem ação no Olist', { mpPagamentoId, status: pagamento.status })
    return
  }

  let situacaoAtual: string | undefined
  try {
    situacaoAtual = await pedidoService.obterSituacao(pedidoId)
  } catch (err) {
    if (err instanceof PedidoServiceError) throw new CheckoutError(err.message, err.detalhes)
    throw err
  }

  if (!transicaoPermitida(situacaoAtual, situacaoDestino)) {
    console.warn('Transição de situação bloqueada — pedido já avançou', {
      pedidoId,
      mpPagamentoId,
      situacaoAtual,
      situacaoDestino,
    })
    return
  }

  try {
    await pedidoService.atualizarSituacao(pedidoId, situacaoDestino)
  } catch (err) {
    if (err instanceof PedidoServiceError) throw new CheckoutError(err.message, err.detalhes)
    throw err
  }

  console.log('Pedido atualizado no Olist', { pedidoId, mpPagamentoId, situacaoAtual, situacaoDestino })
}
