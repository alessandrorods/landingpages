import type { CreateOrderInput, OrderDTO, OrderItemDTO, OrderStatus, PaymentMethod, OrderHistoryEntryDTO } from './order.types'
import type { OrderRepository } from './order.repository'
import type { OlistSyncEventRepository } from './olist-sync-event.repository'

export class OrderServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderServiceError'
  }
}

const STATUS_PROGRESSION: OrderStatus[] = [
  'pending', 'approved', 'preparing', 'invoiced', 'ready', 'dispatched', 'delivered',
]

function canTransition(current: OrderStatus | null, next: OrderStatus): boolean {
  if (next === 'cancelled') {
    const idx = STATUS_PROGRESSION.indexOf(current ?? 'pending')
    return idx <= STATUS_PROGRESSION.indexOf('approved')
  }
  const idxCurrent = STATUS_PROGRESSION.indexOf(current ?? '' as OrderStatus)
  const idxNext = STATUS_PROGRESSION.indexOf(next)
  return idxCurrent !== -1 && idxNext > idxCurrent
}

function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

function fmtDatetime(d: Date): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  return `${g('day')}/${g('month')} ${g('hour')}:${g('minute')}`
}

type PrismaOrder = Awaited<ReturnType<OrderRepository['findById']>>
type PrismaOrderWithItems = NonNullable<PrismaOrder>

export function toOrderDTO(order: PrismaOrderWithItems, history: OrderHistoryEntryDTO[] = []): OrderDTO {
  const totalAmount = order.items.reduce(
    (s, i) => s + Number(i.price) * i.quantity,
    Number(order.freight),
  )
  const items: OrderItemDTO[] = order.items.map((i) => ({
    id: i.id,
    sku: i.sku,
    name: i.name,
    price: Number(i.price),
    quantity: i.quantity,
  }))
  return {
    id: order.id,
    olistNumero: order.olistNumero,
    status: order.status as OrderStatus,
    payment: order.payment as PaymentMethod,
    freight: Number(order.freight),
    notes: order.notes,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    cardMessage: order.cardMessage,
    zipCode: order.zipCode,
    street: order.street,
    streetNumber: order.streetNumber,
    complement: order.complement,
    neighborhood: order.neighborhood,
    deliveryDate: fmtDate(order.deliveryDate),
    deliveryPeriod: order.deliveryPeriod,
    courierName: order.courierName,
    dispatchedAt: order.dispatchedAt ? fmtDatetime(order.dispatchedAt) : null,
    deliveredAt: order.deliveredAt ? fmtDatetime(order.deliveredAt) : null,
    receivedBy: order.receivedBy,
    mpPreferenceId: order.mpPreferenceId,
    source: order.source,
    totalAmount,
    items,
    history,
    createdAt: order.createdAt.toISOString(),
  }
}

export function createOrderService(
  repository: OrderRepository,
  syncEventRepository: OlistSyncEventRepository,
) {
  return {
    async createOrder(input: CreateOrderInput): Promise<OrderDTO> {
      const raw = await repository.create(input)
      await syncEventRepository.create(raw.id, 'order_created', input as object)
      return toOrderDTO(raw)
    },

    async listByStatus(status: OrderStatus): Promise<OrderDTO[]> {
      const rows = await repository.findByStatus(status)
      return rows.map((r) => toOrderDTO(r))
    },

    async getById(id: number): Promise<OrderDTO | null> {
      const row = await repository.findById(id)
      return row ? toOrderDTO(row) : null
    },

    async updateStatus(id: number, status: OrderStatus): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      if (!canTransition(row.status as OrderStatus, status)) {
        throw new OrderServiceError('Transição de status não permitida')
      }
      await repository.updateStatus(id, status)
      await syncEventRepository.create(id, 'status_updated', { status })
    },

    async dispatch(id: number, courierName: string): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      await repository.updateDispatch(id, { courierName, dispatchedAt: new Date() })
      await repository.updateStatus(id, 'dispatched')
      await syncEventRepository.create(id, 'status_updated', { status: 'dispatched' })
    },

    async deliver(id: number, receivedBy: string, courierName: string): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      await repository.updateDelivery(id, { deliveredAt: new Date(), receivedBy, courierName })
      await repository.updateStatus(id, 'delivered')
      await syncEventRepository.create(id, 'status_updated', { status: 'delivered' })
    },

    async findByNumero(numero: string): Promise<OrderDTO | null> {
      const row = await repository.findByNumero(numero)
      return row ? toOrderDTO(row) : null
    },

    async approveFromPayment(orderId: number): Promise<boolean> {
      const row = await repository.findById(orderId)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      if (!canTransition(row.status as OrderStatus, 'approved')) {
        console.warn('[orders] approveFromPayment bloqueado', { orderId, status: row.status })
        return false
      }
      await repository.updateStatus(orderId, 'approved')
      await syncEventRepository.create(orderId, 'status_updated', { status: 'approved' })
      return true
    },

    async setMpPreferenceId(id: number, mpPreferenceId: string): Promise<void> {
      await repository.updateMpPreferenceId(id, mpPreferenceId)
    },
  }
}

export type OrderService = ReturnType<typeof createOrderService>
