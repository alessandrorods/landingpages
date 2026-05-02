import type { MercadoPagoClient } from './client'
import type { MPPreferenciaPayload, MPPagamentoResponse } from './types'

export class PagamentoServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PagamentoServiceError'
  }
}

export function createPagamentoService(client: MercadoPagoClient) {
  return {
    async criarPreferencia(payload: MPPreferenciaPayload): Promise<{ initPoint: string; id: string }> {
      const res = await client.criarPreferencia(payload)
      const initPoint = process.env.NODE_ENV === 'production' ? res.init_point : res.sandbox_init_point
      return { initPoint, id: res.id }
    },

    async buscarPagamento(id: string): Promise<MPPagamentoResponse> {
      return client.buscarPagamento(id)
    },
  }
}

export type PagamentoService = ReturnType<typeof createPagamentoService>
