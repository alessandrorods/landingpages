export type Actor =
  | { type: 'user'; name: string }
  | { type: 'system'; name: string }

export type OrderHistoryAction =
  | 'created'
  | 'approved'
  | 'preparing'
  | 'invoiced'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'undelivered'
  | 'cancelled'

export interface OrderHistoryEntryDTO {
  id: number
  action: OrderHistoryAction
  actorType: 'user' | 'system'
  actorName: string
  metadata: Record<string, string> | null
  createdAt: string
}

export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'preparing'
  | 'invoiced'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'undelivered'
  | 'cancelled'

export type PaymentMethod = 'pix' | 'card' | 'mp_link'

export interface CreateOrderInput {
  payment: PaymentMethod
  freight: number
  notes?: string
  buyerName: string
  buyerPhone: string
  recipientName: string
  recipientPhone: string
  cardMessage?: string
  zipCode: string
  street: string
  streetNumber: string
  complement?: string
  neighborhood: string
  deliveryDate: string  // DD/MM/YYYY
  deliveryPeriod: string
  items: Array<{ sku?: string; name: string; price: number; quantity: number }>
  source: 'admin' | 'checkout'
}

export interface OrderItemDTO {
  id: string
  sku: string | null
  name: string
  price: number
  quantity: number
}

export interface OrderDTO {
  id: number
  olistNumero: string | null
  status: OrderStatus
  payment: PaymentMethod
  freight: number
  notes: string | null
  buyerName: string
  buyerPhone: string
  recipientName: string
  recipientPhone: string
  cardMessage: string | null
  zipCode: string
  street: string
  streetNumber: string
  complement: string | null
  neighborhood: string
  deliveryDate: string  // DD/MM/YYYY — pronto para exibição
  deliveryPeriod: string
  courierName: string | null
  dispatchedAt: string | null   // DD/MM HH:MM
  deliveredAt: string | null    // DD/MM HH:MM
  receivedBy: string | null
  mpPreferenceId: string | null
  source: string
  totalAmount: number
  items: OrderItemDTO[]
  history: OrderHistoryEntryDTO[]
  createdAt: string
}
