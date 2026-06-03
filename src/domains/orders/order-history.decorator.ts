import type { OrderService } from './order.service'
import { fmtDatetime } from './order.service'
import type { OrderHistoryRepository } from './order-history.repository'
import type { Actor, CreateOrderInput, OrderHistoryAction, OrderHistoryEntryDTO, OrderStatus } from './order.types'
import { signPhotoUrl } from '@/core/photo/signedUrl'

type RawEntry = Awaited<ReturnType<OrderHistoryRepository['findByOrderId']>>[number]

function toHistoryEntryDTO(e: RawEntry): OrderHistoryEntryDTO {
  return {
    id:        e.id,
    action:    e.action as OrderHistoryAction,
    actorType: e.actorType as 'user' | 'system',
    actorName: e.actorName,
    actorRole: e.actorRole ?? null,
    metadata:  e.metadata as Record<string, unknown> | null,
    createdAt: e.createdAt.toISOString(),
  }
}

async function redactPhotoUrls(entry: OrderHistoryEntryDTO): Promise<OrderHistoryEntryDTO> {
  if (entry.action !== 'undelivered' || !entry.metadata) return entry
  const urls = entry.metadata.photoUrls
  if (!Array.isArray(urls) || urls.length === 0) return entry
  return {
    ...entry,
    metadata: {
      ...entry.metadata,
      photoUrls: await Promise.all((urls as string[]).map(signPhotoUrl)),
    },
  }
}

export function withOrderHistory(service: OrderService, historyRepository: OrderHistoryRepository) {
  return {
    async createOrder(input: CreateOrderInput, actor: Actor) {
      const order = await service.createOrder(input)
      await historyRepository.record(order.id, 'created', actor, { source: input.source })
      return order
    },

    async updateStatus(id: number, status: OrderStatus, actor: Actor) {
      await service.updateStatus(id, status)
      await historyRepository.record(id, status as OrderHistoryAction, actor)
    },

    async dispatch(id: number, courierId: string, courierName: string, actor: Actor) {
      await service.dispatch(id, courierId)
      await historyRepository.record(id, 'dispatched', actor, { courierName })
    },

    async deliver(id: number, receivedBy: string, courierId: string, courierName: string, actor: Actor) {
      await service.deliver(id, receivedBy, courierId)
      await historyRepository.record(id, 'delivered', actor, { courierName, receivedBy })
    },

    async markUndelivered(
      id: number,
      evidence: { reason: string; notes?: string; photoUrls: string[]; lat?: number; lng?: number },
      actor: Actor,
    ) {
      await service.markUndelivered(id, evidence)
      await historyRepository.record(id, 'undelivered', actor, evidence)
    },

    async rescheduleOrder(
      id: number,
      schedule: { deliveryDate: string; deliveryPeriod?: string },
      actor: Actor,
    ) {
      await service.rescheduleOrder(id, schedule)
      await historyRepository.record(id, 'ready', actor, schedule)
    },

    async approveFromPayment(orderId: number, actor: Actor) {
      const transitioned = await service.approveFromPayment(orderId)
      if (transitioned) await historyRepository.record(orderId, 'approved', actor)
    },

    async getById(id: number) {
      const [order, entries] = await Promise.all([
        service.getById(id),
        historyRepository.findByOrderId(id),
      ])
      if (!order) return null
      const history = await Promise.all(entries.map(toHistoryEntryDTO).map(redactPhotoUrls))
      const dispatched = history.findLast((h) => h.action === 'dispatched')
      const delivered  = history.findLast((h) => h.action === 'delivered')
      return {
        ...order,
        dispatchedAt: dispatched ? fmtDatetime(new Date(dispatched.createdAt)) : null,
        deliveredAt:  delivered  ? fmtDatetime(new Date(delivered.createdAt))  : null,
        receivedBy:   delivered?.metadata?.receivedBy ?? null,
        history,
      }
    },

    // Pass-throughs — sem efeito colateral de histórico
    listByStatus:                service.listByStatus.bind(service),
    listDeliveredTodayByCourier: service.listDeliveredTodayByCourier.bind(service),
    findByNumero:                service.findByNumero.bind(service),
    setMpPreferenceId:           service.setMpPreferenceId.bind(service),
  }
}

export type TrackedOrderService = ReturnType<typeof withOrderHistory>
