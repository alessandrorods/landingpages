export interface MPPreferenciaPayload {
  external_reference: string
  items: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    currency_id: string
  }>
  payer?: {
    name: string
    phone?: { number: string }
  }
  back_urls?: {
    success: string
    failure: string
    pending: string
  }
  auto_return?: 'approved' | 'all'
  notification_url?: string
}

export interface MPPreferenciaResponse {
  id: string
  init_point: string
  sandbox_init_point: string
}

export interface MPWebhookPayload {
  type: string
  action: string
  data: { id: string }
}

export interface MPPagamentoResponse {
  id: number
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded'
  status_detail: string
  external_reference: string
  transaction_amount: number
}
