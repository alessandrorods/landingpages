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

  // pedido.alterar.php requires JSON body — token and id go in query string
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
  }
}

export type OlistClient = ReturnType<typeof createOlistClient>
