import type { TinyPedidoPayload, TinyResponse, SituacaoPedido, TinyPedidosResponse, TinyPedidoObterResponse, TinyAlterarPedidoDados, TinyAlterarResponse } from './types'

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
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('[olist] HTTP error', { endpoint, ...logParams, status: res.status, body })
    throw new OlistClientError(`Olist retornou HTTP ${res.status}`, res.status, body)
  }

  const json = await res.json() as T
  const retorno = (json as { retorno?: { codigo_erro?: number } }).retorno
  if (retorno?.codigo_erro === 6)  console.warn('[olist] rate limit (cod 6 — muitos acessos/minuto)', { endpoint })
  if (retorno?.codigo_erro === 11) console.warn('[olist] rate limit (cod 11 — muitos acessos concorrentes)', { endpoint })

  console.log('[olist]', endpoint, logParams, '->', JSON.stringify(json))
  return json
}

export function createOlistClient(token: string) {
  // Endpoints form-encoded: token + params no body
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
      throw new OlistClientError(`Falha ao conectar com Olist (${endpoint})`)
    }
  }

  // Endpoints JSON: token + id na URL, body como JSON — necessário para pedido.alterar.php
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
      throw new OlistClientError(`Falha ao conectar com Olist (${endpoint})`)
    }
  }

  return {
    incluirPedido: (payload: TinyPedidoPayload) =>
      post<TinyResponse>('pedido.incluir.php', { pedido: JSON.stringify(payload) }),

    atualizarSituacaoPedido: (id: number, situacao: SituacaoPedido) =>
      post<TinyResponse>('pedido.alterar.situacao', { id: String(id), situacao }),

    buscarPedidos: (situacao: SituacaoPedido, dataInicial?: string) =>
      post<TinyPedidosResponse>('pedidos.pesquisa.php', {
        situacao,
        ...(dataInicial && { dataInicial }),
      }),

    buscarPedidoPorNumero: (numero: string) =>
      post<TinyPedidosResponse>('pedidos.pesquisa.php', { numero }),

    obterPedido: (id: number) =>
      post<TinyPedidoObterResponse>('pedido.obter.php', { id: String(id) }),

    alterarPedido: (id: number, dados: TinyAlterarPedidoDados) =>
      postJson<TinyAlterarResponse>('pedido.alterar.php', { id: String(id) }, { dados_pedido: dados }),
  }
}

export type OlistClient = ReturnType<typeof createOlistClient>
