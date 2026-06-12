import type { CreateOrderInput, UpdateOrderInput, OrderDTO, OrderItemDTO, OrderStatus, PaymentMethod, OrderHistoryEntryDTO } from './order.types'
import type { OrderRepository } from './order.repository'
import type { OlistSyncEventRepository } from './olist-sync-event.repository'
import type { LiSyncEventRepository } from './li-sync-event.repository'

export class OrderServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OrderServiceError'
  }
}

const DELIVERY_PROGRESSION: OrderStatus[] = [
  'pending', 'approved', 'preparing', 'ready', 'dispatched', 'delivered',
]

const PICKUP_PROGRESSION: OrderStatus[] = [
  'pending', 'approved', 'preparing', 'available_for_pickup', 'delivered',
]

function canTransition(current: OrderStatus | null, next: OrderStatus, pickup = false): boolean {
  if (next === 'cancelled') {
    const progression = pickup ? PICKUP_PROGRESSION : DELIVERY_PROGRESSION
    const idx = progression.indexOf(current ?? 'pending')
    return idx <= progression.indexOf('approved')
  }
  const progression = pickup ? PICKUP_PROGRESSION : DELIVERY_PROGRESSION
  const idxCurrent = progression.indexOf(current ?? '' as OrderStatus)
  const idxNext = progression.indexOf(next)
  return idxCurrent !== -1 && idxNext > idxCurrent
}

export function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

export function fmtDatetime(d: Date): string {
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
    pickup: order.pickup,
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

    courierName: order.courier?.displayName ?? null,
    dispatchedAt: null,
    deliveredAt: null,
    receivedBy: null,
    mpPreferenceId: order.mpPreferenceId,
    source: order.source,
    totalAmount,
    items,
    history,
    createdAt: order.createdAt.toISOString(),
  }
}

const STATUS_TO_LI: Partial<Record<OrderStatus, string>> = {
  preparing:   'em_producao',
  ready:       'pedido_em_separacao',
  dispatched:  'pedido_enviado',
  delivered:   'pedido_entregue',
  cancelled:   'pedido_cancelado',
  undelivered: 'pedido_enviado',
}

export function createOrderService(
  repository: OrderRepository,
  syncEventRepository: OlistSyncEventRepository,
  liSyncEventRepository?: LiSyncEventRepository,
) {
  async function enqueueLiSync(orderId: number, status: OrderStatus, source: string): Promise<void> {
    if (source !== 'loja_integrada' || !liSyncEventRepository) return
    const codigo = STATUS_TO_LI[status]
    if (!codigo) return
    await liSyncEventRepository.create(orderId, 'status_updated', { codigo })
  }

  return {
    async createOrder(input: CreateOrderInput): Promise<OrderDTO> {
      const raw = await repository.create(input)
      if (input.source !== 'loja_integrada') {
        await syncEventRepository.create(raw.id, 'order_created', input as object)
      }
      if (input.initialStatus === 'approved') {
        await repository.updateStatus(raw.id, 'approved')
        return toOrderDTO({ ...raw, status: 'approved' as OrderStatus })
      }
      return toOrderDTO(raw)
    },

    async listByStatus(status: OrderStatus, courierId?: string): Promise<OrderDTO[]> {
      const rows = await repository.findByStatus(status, courierId)
      return rows.map((r) => toOrderDTO(r))
    },

    async listDeliveredToday(): Promise<OrderDTO[]> {
      const rows = await repository.findDeliveredToday()
      return rows.map((r) => toOrderDTO(r))
    },

    async listDeliveredTodayByCourier(courierId: string): Promise<OrderDTO[]> {
      const rows = await repository.findDeliveredTodayByCourier(courierId)
      return rows.map((r) => toOrderDTO(r))
    },

    async getById(id: number): Promise<OrderDTO | null> {
      const row = await repository.findById(id)
      return row ? toOrderDTO(row) : null
    },

    async updateStatus(id: number, status: OrderStatus, options?: { force?: boolean }): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      if (!options?.force && !canTransition(row.status as OrderStatus, status, row.pickup)) {
        throw new OrderServiceError('Transição de status não permitida')
      }
      await repository.updateStatus(id, status)
      await syncEventRepository.create(id, 'status_updated', { status })
      await enqueueLiSync(id, status, row.source)
    },

    async dispatch(id: number, courierId: string): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      await repository.updateDispatch(id, { courierId })
      await repository.updateStatus(id, 'dispatched')
      await syncEventRepository.create(id, 'status_updated', { status: 'dispatched' })
      await enqueueLiSync(id, 'dispatched', row.source)
    },

    async deliver(id: number, receivedBy: string, courierId: string): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      await repository.updateDelivery(id, { courierId })
      await repository.updateStatus(id, 'delivered')
      await syncEventRepository.create(id, 'status_updated', { status: 'delivered' })
      await enqueueLiSync(id, 'delivered', row.source)
    },

    async markUndelivered(
      id: number,
      evidence: { reason: string; notes?: string; photoUrls: string[]; lat?: number; lng?: number },
    ): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      if (row.status !== 'dispatched') throw new OrderServiceError('Pedido não está em rota')
      await repository.updateStatus(id, 'undelivered')
      await syncEventRepository.create(id, 'status_updated', { status: 'undelivered' })
      await enqueueLiSync(id, 'undelivered', row.source)
    },

    async rescheduleOrder(
      id: number,
      schedule: { deliveryDate: string; deliveryPeriod?: string },
    ): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      if (row.status !== 'undelivered') throw new OrderServiceError('Pedido não está com status não entregue')
      await repository.updateDeliverySchedule(id, schedule.deliveryDate, schedule.deliveryPeriod ?? null)
      await repository.clearCourier(id)
      await repository.updateStatus(id, 'ready')
      await syncEventRepository.create(id, 'status_updated', { status: 'ready', rescheduled: true })
      await enqueueLiSync(id, 'ready', row.source)
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

    async updateOrder(id: number, data: UpdateOrderInput): Promise<void> {
      const row = await repository.findById(id)
      if (!row) throw new OrderServiceError('Pedido não encontrado')
      await repository.updateOrder(id, data)
      await syncEventRepository.create(id, 'order_updated', {
        notes:        data.notes ?? null,
        cardMessage:  data.cardMessage ?? null,
        deliveryDate: data.deliveryDate,
      })
    },
  }
}

export type OrderService = ReturnType<typeof createOrderService>
