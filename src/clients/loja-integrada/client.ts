import type { LIWebhookStatusResponse, LIWebhookPayload, LIListFormasEnvioResponse } from './types'

const BASE_URL = 'https://api.awsli.com.br'

export class LIClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message)
    this.name = 'LIClientError'
  }
}

export function createLIClient(chaveApi: string, chaveAplicacao: string) {
  const authHeader = `chave_api ${chaveApi} aplicacao ${chaveAplicacao}`

  async function request<T>(method: string, path: string, body?: object): Promise<T> {
    let text = ''
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      text = await res.text().catch(() => '')
      if (!res.ok && res.status !== 404) {
        console.error('[li] HTTP error', { method, path, status: res.status, body: text })
        throw new LIClientError(`LI returned HTTP ${res.status}`, res.status, text)
      }
      return JSON.parse(text) as T
    } catch (err) {
      if (err instanceof LIClientError) throw err
      console.error('[li] network error', { method, path, err })
      throw new LIClientError(`Failed to connect to LI (${path})`)
    }
  }

  return {
    registerWebhook: async (notifyUrl: string, token: string): Promise<void> => {
      const webhookBody = { notifyUrl, token }
      // DELETE existing, then PUT new
      try {
        await request<unknown>('DELETE', '/webhooks/v1/pedido', webhookBody)
      } catch {
        // 404 or no webhook registered yet — proceed
      }
      await request<unknown>('PUT', '/webhooks/v1/pedido', webhookBody)
    },

    updateOrderStatus: (pedidoId: number, codigo: string) =>
      request<LIWebhookStatusResponse>('PUT', `/v1/situacao/pedido/${pedidoId}`, { codigo }),

    listShippingMethods: () =>
      request<LIListFormasEnvioResponse>('GET', '/v1/envio/?limit=100'),

    getOrder: async (pedidoId: number): Promise<LIWebhookPayload | null> => {
      try {
        return await request<LIWebhookPayload>('GET', `/v1/pedido/${pedidoId}`)
      } catch (err) {
        if (err instanceof LIClientError && err.status === 404) return null
        throw err
      }
    },
  }
}

export type LIClient = ReturnType<typeof createLIClient>
