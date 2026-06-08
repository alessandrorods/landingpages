import type { OrderHistoryAction, OrderStatus } from '@/domains/orders/order.types'

export const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
  pending:     { label: 'Aguardando pagamento', cls: 'bg-gray-100 text-gray-600' },
  approved:    { label: 'Pago',                 cls: 'bg-green-100 text-green-700' },
  preparing:   { label: 'Preparando',           cls: 'bg-blue-100 text-blue-700' },
  ready:                { label: 'Pronto para envio',      cls: 'bg-blue-100 text-blue-700' },
  available_for_pickup: { label: 'Disponível para retirada', cls: 'bg-purple-100 text-purple-700' },
  dispatched:           { label: 'Saiu para entrega',        cls: 'bg-orange-100 text-orange-700' },
  delivered:   { label: 'Entregue',             cls: 'bg-green-100 text-green-800' },
  undelivered: { label: 'Não entregue',         cls: 'bg-red-100 text-red-700' },
  cancelled:   { label: 'Cancelado',            cls: 'bg-red-100 text-red-700' },
}

export const ACTION_LABEL: Record<OrderHistoryAction, string> = {
  created:     'Pedido criado',
  approved:    'Pagamento aprovado',
  preparing:   'Em preparação',
  ready:                'Pronto para envio',
  available_for_pickup: 'Disponível para retirada',
  dispatched:           'Saiu para entrega',
  delivered:   'Entregue',
  undelivered: 'Não entregue',
  cancelled:   'Cancelado',
}

export const ACTION_DOT: Record<OrderHistoryAction, string> = {
  created:     'bg-gray-400',
  approved:    'bg-green-500',
  preparing:   'bg-blue-500',
  ready:                'bg-blue-500',
  available_for_pickup: 'bg-purple-500',
  dispatched:           'bg-orange-500',
  delivered:   'bg-green-600',
  undelivered: 'bg-red-500',
  cancelled:   'bg-red-500',
}

export const METADATA_LABEL: Record<string, string> = {
  courierName:    'Motoboy',
  receivedBy:     'Recebido por',
  source:         'Via',
  reason:         'Motivo',
  notes:          'Observações',
  deliveryDate:   'Nova data',
  deliveryPeriod: 'Período',
}
