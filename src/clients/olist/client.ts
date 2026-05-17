import type {
  OlistOrderPayload,
  OlistMutationResponse,
  OlistOrderStatus,
  OlistListOrdersResponse,
  OlistGetOrderResponse,
  OlistUpdateOrderData,
  OlistUpdateResponse,
  OlistProductsResponse,
} from './types'
import type { CreateOrderInput, OrderStatus, PaymentMethod } from '@/domains/orders/order.types'
import { PERIODOS_ENTREGA, FRETE_POR_CONTA } from '@/constants/pedido'

const BASE_URL = 'https://api.tiny.com.br/api2'

export class OlistClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message)
    this.name = 'OlistClientError'
  }
}

// ── Mappers (domain → Olist) ──────────────────────────────────────────────────

const STATUS_TO_OLIST: Record<OrderStatus, OlistOrderStatus | null> = {
  pending:     'aberto',
  approved:    'aprovado',
  preparing:   'preparando_envio',
  ready:       'pronto_envio',
  dispatched:  'enviado',
  delivered:   'entregue',
  undelivered: 'nao_entregue',
  cancelled:   'cancelado',
}

const PAYMENT_TO_OLIST: Record<PaymentMethod, string> = {
  pix:     'pix',
  card:    'credito',
  mp_link: 'credito',
}

function buildOlistPayload(orderId: number, input: CreateOrderInput): OlistOrderPayload {
  const formaFrete = PERIODOS_ENTREGA.find((p) => p.id === input.deliveryPeriod)?.idOlist
  const formaPag = PAYMENT_TO_OLIST[input.payment]
  const total = input.items.reduce((s, i) => s + i.price * i.quantity, input.freight)
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

  return {
    pedido: {
      situacao: 'aberto',
      data_prevista: input.deliveryDate,
      numero_pedido_ecommerce: String(orderId),
      marcadores: [{ marcador: { descricao: 'pedido-manual' } }],
      valor_frete: input.freight,
      frete_por_conta: FRETE_POR_CONTA,
      forma_envio: 'T',
      ...(formaFrete && { forma_frete: formaFrete }),
      ...(input.cardMessage && { obs_internas: input.cardMessage }),
      ...(input.notes && { obs: input.notes }),
      forma_pagamento: formaPag,
      parcelas: [{
        parcela: {
          dias: 0,
          data: hoje,
          valor: total,
          forma_pagamento: formaPag,
          meio_pagamento: 'Mercado Pago (PJ) ⭐',
        },
      }],
      cliente: {
        nome: input.buyerName,
        fone: input.buyerPhone,
      },
      endereco_entrega: {
        nome_destinatario: input.recipientName,
        fone: input.recipientPhone,
        endereco: input.street,
        numero: input.streetNumber,
        complemento: input.complement ?? '',
        bairro: input.neighborhood,
        cep: input.zipCode.replace(/\D/g, ''),
        cidade: 'Mogi das Cruzes',
        uf: 'SP',
      },
      itens: input.items.map((i) => ({
        item: {
          descricao: i.name,
          unidade: 'UN',
          quantidade: i.quantity,
          valor_unitario: i.price,
        },
      })),
    },
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response, endpoint: string, logParams: Record<string, unknown>): Promise<T> {
  const text = await res.text().catch(() => '')

  if (!res.ok) {
    console.error('[olist] HTTP error', { endpoint, ...logParams, status: res.status, body: text })
    throw new OlistClientError(`Olist returned HTTP ${res.status}`, res.status, text)
  }

  let json: T
  try {
    json = JSON.parse(text) as T
  } catch {
    console.error('[olist] invalid JSON response', { endpoint, ...logParams, body: text })
    throw new OlistClientError(`Olist returned invalid JSON (${endpoint})`)
  }

  const retorno = (json as { retorno?: { codigo_erro?: number } }).retorno
  if (retorno?.codigo_erro === 6)  console.warn('[olist] rate limit hit (code 6 — too many requests/minute)', { endpoint })
  if (retorno?.codigo_erro === 11) console.warn('[olist] rate limit hit (code 11 — too many concurrent requests)', { endpoint })

  return json
}

// ── Client factory ────────────────────────────────────────────────────────────

export function createOlistClient(token: string) {
  async function post<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const safeParams = { ...params, token: '[REDACTED]' }
    try {
      const body = new URLSearchParams({ token, formato: 'JSON', ...params })
      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      return handleResponse<T>(res, endpoint, safeParams)
    } catch (err) {
      if (err instanceof OlistClientError) throw err
      console.error('[olist] network error', { endpoint, params: safeParams, err })
      throw new OlistClientError(`Failed to connect to Olist (${endpoint})`)
    }
  }

  async function postJson<T>(endpoint: string, urlParams: Record<string, string>, body: Record<string, unknown>): Promise<T> {
    const safeUrlParams = { ...urlParams, token: '[REDACTED]' }
    const url = new URL(`${BASE_URL}/${endpoint}`)
    url.searchParams.set('token', token)
    url.searchParams.set('format', 'JSON')
    for (const [k, v] of Object.entries(urlParams)) url.searchParams.set(k, v)

    try {
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      return handleResponse<T>(res, endpoint, safeUrlParams)
    } catch (err) {
      if (err instanceof OlistClientError) throw err
      console.error('[olist] network error', { endpoint, urlParams: safeUrlParams, err })
      throw new OlistClientError(`Failed to connect to Olist (${endpoint})`)
    }
  }

  return {
    // Low-level HTTP methods
    createOrder: (payload: OlistOrderPayload) =>
      post<OlistMutationResponse>('pedido.incluir.php', { pedido: JSON.stringify(payload) }),

    updateOrderStatus: (id: number, situacao: OlistOrderStatus) =>
      post<OlistMutationResponse>('pedido.alterar.situacao', { id: String(id), situacao }),

    listOrders: (situacao: OlistOrderStatus, opts?: { dataInicial?: string; dataAtualizacao?: string }) =>
      post<OlistListOrdersResponse>('pedidos.pesquisa.php', {
        situacao,
        ...(opts?.dataInicial     && { dataInicial:     opts.dataInicial }),
        ...(opts?.dataAtualizacao && { dataAtualizacao: opts.dataAtualizacao }),
      }),

    findOrderByNumber: (numero: string) =>
      post<OlistListOrdersResponse>('pedidos.pesquisa.php', { numero }),

    getOrder: (id: number) =>
      post<OlistGetOrderResponse>('pedido.obter.php', { id: String(id) }),

    updateOrder: (id: number, dados: OlistUpdateOrderData) =>
      postJson<OlistUpdateResponse>('pedido.alterar.php', { id: String(id) }, { dados_pedido: dados }),

    listProducts: (pesquisa: string) =>
      post<OlistProductsResponse>('produtos.pesquisa.php', { pesquisa }),

    // Domain-level methods — accept our types, handle Olist translation internally
    async createOrderFromDomain(orderId: number, input: CreateOrderInput): Promise<{ id: number; numero: string } | null> {
      const payload = buildOlistPayload(orderId, input)
      const result = await post<OlistMutationResponse>('pedido.incluir.php', { pedido: JSON.stringify(payload) })
      if (result.retorno?.status !== 'OK') {
        const erros = (result.retorno?.erros ?? []).map((e) => e.erro).join('; ')
        console.error('[olist] createOrderFromDomain falhou', { erros })
        return null
      }
      const registro = result.retorno?.registros?.registro
      return registro ? { id: registro.id, numero: registro.numero } : null
    },

    async syncStatus(olistId: number | null, status: OrderStatus): Promise<void> {
      if (!olistId) { console.warn('[olist] syncStatus ignorado — sem olistId'); return }
      const olistStatus = STATUS_TO_OLIST[status]
      if (!olistStatus) { console.warn('[olist] syncStatus sem mapeamento', { status }); return }
      try {
        await post<OlistMutationResponse>('pedido.alterar.situacao', { id: String(olistId), situacao: olistStatus })
      } catch (err) {
        console.error('[olist] syncStatus falhou', { olistId, status, err })
      }
    },
  }
}

export type OlistClient = ReturnType<typeof createOlistClient>
