export type Actor =
  | { type: 'user'; name: string; role: string }
  | { type: 'system'; name: string }

export type OrderHistoryAction =
  | 'created'
  | 'approved'
  | 'preparing'
  | 'ready'
  | 'available_for_pickup'
  | 'dispatched'
  | 'delivered'
  | 'undelivered'
  | 'cancelled'
  | 'edited'

export interface OrderHistoryEntryDTO {
  id: number
  action: OrderHistoryAction
  actorType: 'user' | 'system'
  actorName: string
  actorRole: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

export type OrderStatus =
  | 'pending'
  | 'approved'
  | 'preparing'
  | 'ready'
  | 'available_for_pickup'
  | 'dispatched'
  | 'delivered'
  | 'undelivered'
  | 'cancelled'

export type PaymentMethod = 'pix' | 'card' | 'mp_link'

export interface UpdateOrderInput {
  buyerName: string
  buyerPhone: string
  recipientName: string
  recipientPhone: string
  cardMessage?: string
  zipCode?: string
  street?: string
  streetNumber?: string
  complement?: string
  neighborhood?: string
  deliveryDate: string    // DD/MM/YYYY
  deliveryPeriod?: string
  freight: number
  notes?: string
  items: Array<{ sku?: string; name: string; price: number; quantity: number }>
}

export interface CreateOrderInput {
  pickup: boolean
  payment: PaymentMethod
  freight: number
  notes?: string
  buyerName: string
  buyerPhone: string
  recipientName: string
  recipientPhone: string
  cardMessage?: string
  zipCode?: string
  street?: string
  streetNumber?: string
  complement?: string
  neighborhood?: string
  deliveryDate: string  // DD/MM/YYYY
  deliveryPeriod?: string
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
  trackingToken?: string  // injected by route handlers, not part of domain
  olistNumero: string | null
  pickup: boolean
  status: OrderStatus
  payment: PaymentMethod
  freight: number
  notes: string | null
  buyerName: string
  buyerPhone: string
  recipientName: string
  recipientPhone: string
  cardMessage: string | null
  zipCode: string | null
  street: string | null
  streetNumber: string | null
  complement: string | null
  neighborhood: string | null
  deliveryDate: string  // DD/MM/YYYY — pronto para exibição
  deliveryPeriod: string | null
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
