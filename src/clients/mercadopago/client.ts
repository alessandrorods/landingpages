import type { MPPreferenciaPayload, MPPreferenciaResponse, MPPagamentoResponse } from './types'

const BASE_URL = 'https://api.mercadopago.com'

export class MercadoPagoClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'MercadoPagoClientError'
  }
}

export function createMercadoPagoClient(accessToken: string) {
  async function request<T>(path: string, options: RequestInit): Promise<T> {
    let res: Response
    try {
      res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      })
    } catch {
      throw new MercadoPagoClientError(`Falha ao conectar com MercadoPago (${path})`)
    }

    if (!res.ok) {
      throw new MercadoPagoClientError(`MercadoPago retornou HTTP ${res.status}`, res.status)
    }

    return res.json() as Promise<T>
  }

  return {
    criarPreferencia: (payload: MPPreferenciaPayload) =>
      request<MPPreferenciaResponse>('/checkout/preferences', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    buscarPagamento: (id: string) =>
      request<MPPagamentoResponse>(`/v1/payments/${id}`, { method: 'GET' }),
  }
}

export type MercadoPagoClient = ReturnType<typeof createMercadoPagoClient>
