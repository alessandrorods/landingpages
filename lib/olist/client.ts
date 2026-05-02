import type { TinyPedidoPayload, TinyResponse, SituacaoPedido } from './types'

const BASE_URL = 'https://api.tiny.com.br/api2'

export class OlistClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'OlistClientError'
  }
}

export function createOlistClient(token: string) {
  async function post<T>(endpoint: string, params: Record<string, string>): Promise<T> {
    const body = new URLSearchParams({ token, formato: 'JSON', ...params })

    let res: Response
    try {
      res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
    } catch {
      throw new OlistClientError(`Falha ao conectar com Olist (${endpoint})`)
    }

    if (!res.ok) {
      throw new OlistClientError(`Olist retornou HTTP ${res.status}`, res.status)
    }

    return res.json() as Promise<T>
  }

  return {
    incluirPedido: (payload: TinyPedidoPayload) =>
      post<TinyResponse>('pedido.incluir.php', { pedido: JSON.stringify(payload) }),

    atualizarSituacaoPedido: (id: number, situacao: SituacaoPedido) =>
      post<TinyResponse>('pedido.alterar.situacao.php', { id: String(id), situacao }),
  }
}

export type OlistClient = ReturnType<typeof createOlistClient>
